import { AnalysisHistoryItem } from './history-cache-manager';

export interface MigrationOptions {
  dryRun?: boolean;          // Preview changes without executing
  batchSize?: number;        // Number of items to process at once
  conflictResolution?: 'local' | 'remote' | 'latest' | 'merge';
  onProgress?: (progress: MigrationProgress) => void;
  onError?: (error: MigrationError) => void;
  onComplete?: (result: MigrationResult) => void;
}

export interface MigrationProgress {
  stage: 'backup' | 'upload' | 'download' | 'merge' | 'cleanup' | 'complete';
  total: number;
  processed: number;
  current: string;
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  merged: number;
  conflicts: number;
  errors: string[];
  duration: number;
  timestamp: number;
}

export interface MigrationError {
  stage: string;
  error: string;
  item?: any;
  recoverable: boolean;
}

/**
 * History migration strategy for transitioning from local storage to database
 */
export class HistoryMigration {
  private readonly localStorageKey = 'analysis_history_migration_backup';
  private readonly migrationLogKey = 'history_migration_log';
  
  // Type assertion for localStorage access
  private get storage(): Storage | null {
    return typeof window !== 'undefined' ? window.localStorage : null;
  }
  
  constructor(private options: MigrationOptions = {}) {}

  /**
   * Execute the full migration process
   */
  async execute(userId: string): Promise<MigrationResult> {
    const startTime = Date.now();
    this.log('info', 'Starting migration process');
    
    try {
      // Stage 1: Backup existing local history
      const backupResult = await this.backupLocalHistory();
      if (!backupResult.success) {
        throw new Error('Failed to backup local history');
      }
      
      this.updateProgress({
        stage: 'backup',
        total: backupResult.count,
        processed: backupResult.count,
        current: 'Local history backed up successfully'
      });

      // Stage 2: Get remote history from database
      const remoteResult = await this.getRemoteHistory(userId);
      
      this.updateProgress({
        stage: 'download',
        total: remoteResult.count,
        processed: remoteResult.count,
        current: 'Remote history downloaded successfully'
      });

      // Stage 3: Upload local-only items to database
      const uploadResult = await this.uploadLocalOnlyItems(backupResult.items, remoteResult.items, userId);
      
      this.updateProgress({
        stage: 'upload',
        total: uploadResult.totalToUpload,
        processed: uploadResult.uploaded,
        current: `Uploaded ${uploadResult.uploaded} items to database`
      });

      // Stage 4: Merge histories and resolve conflicts
      const mergeResult = await this.mergeHistories(backupResult.items, remoteResult.items, userId);
      
      this.updateProgress({
        stage: 'merge',
        total: mergeResult.totalItems,
        processed: mergeResult.processedItems,
        current: `Merged ${mergeResult.processedItems} items with ${mergeResult.conflicts} conflicts resolved`
      });

      // Stage 5: Cleanup
      await this.cleanup();
      
      this.updateProgress({
        stage: 'cleanup',
        total: mergeResult.totalItems,
        processed: mergeResult.totalItems,
        current: 'Migration cleanup completed'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const result: MigrationResult = {
        success: true,
        uploaded: uploadResult.uploaded,
        downloaded: remoteResult.count,
        merged: mergeResult.processedItems,
        conflicts: mergeResult.conflicts,
        errors: [],
        duration,
        timestamp: endTime
      };

      this.log('info', 'Migration completed successfully', result);
      this.options.onComplete?.(result);
      
      return result;

    } catch (error) {
      const migrationError: MigrationError = {
        stage: 'general',
        error: error instanceof Error ? error.message : 'Unknown error',
        recoverable: false
      };
      
      this.log('error', 'Migration failed', migrationError);
      this.options.onError?.(migrationError);
      
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        merged: 0,
        conflicts: 0,
        errors: [migrationError.error],
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Stage 1: Backup local history
   */
  private async backupLocalHistory(): Promise<{ success: boolean; items: AnalysisHistoryItem[]; count: number }> {
    try {
      this.log('info', 'Backing up local history');
      
      // Get existing history from localStorage
      const existingData = this.storage?.getItem('analysis-store');
      if (!existingData) {
        return { success: true, items: [], count: 0 };
      }

      const parsed = JSON.parse(existingData);
      const historyItems = parsed.state?.analysisHistory || [];
      
      // Create backup
      const backup = {
        data: historyItems,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      this.storage?.setItem(this.localStorageKey, JSON.stringify(backup));
      
      this.log('info', `Backed up ${historyItems.length} history items`);
      
      return { 
        success: true, 
        items: historyItems, 
        count: historyItems.length 
      };
      
    } catch (error) {
      this.log('error', 'Failed to backup local history', error);
      return { success: false, items: [], count: 0 };
    }
  }

  /**
   * Stage 2: Get remote history from database
   */
  private async getRemoteHistory(userId: string): Promise<{ items: AnalysisHistoryItem[]; count: number }> {
    try {
      this.log('info', 'Fetching remote history from database');
      
      // Get auth token from Supabase session
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        throw new Error('Authentication required: No valid session available');
      }
      
      const token = session.access_token;
      
      const response = await fetch('/api/analyses/recent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          limit: 1000, // Get all items for migration
          type: 'all',
          sort_by: 'created_at',
          sort_order: 'desc'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch remote history: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch remote history');
      }

      const items = result.data.analyses || [];
      
      this.log('info', `Fetched ${items.length} items from remote database`);
      
      return { items, count: items.length };
      
    } catch (error) {
      this.log('error', 'Failed to fetch remote history', error);
      return { items: [], count: 0 };
    }
  }

  /**
   * Stage 3: Upload local-only items to database
   */
  private async uploadLocalOnlyItems(
    localItems: AnalysisHistoryItem[], 
    remoteItems: AnalysisHistoryItem[], 
    userId: string
  ): Promise<{ uploaded: number; totalToUpload: number }> {
    try {
      this.log('info', 'Uploading local-only items to database');
      
      const remoteIds = new Set(remoteItems.map(item => item.id));
      const localOnlyItems = localItems.filter(item => !remoteIds.has(item.id));
      
      if (localOnlyItems.length === 0) {
        return { uploaded: 0, totalToUpload: 0 };
      }

      let uploaded = 0;
      const batchSize = this.options.batchSize || 10;
      
      // Process in batches
      for (let i = 0; i < localOnlyItems.length; i += batchSize) {
        const batch = localOnlyItems.slice(i, i + batchSize);
        
        if (this.options.dryRun) {
          this.log('info', `[DRY RUN] Would upload batch of ${batch.length} items`);
          uploaded += batch.length;
          continue;
        }

        try {
          // Get auth token for batch upload
          const { supabase } = await import('@/lib/supabase/client');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session?.access_token) {
            throw new Error('Authentication required: No valid session available');
          }
          
          const token = session.access_token;
          
          const promises = batch.map(item => {
            // Transform data to match API requirements
            const apiData = {
              id: item.id,
              session_id: userId,
              type: item.type,
              input_text: item.input,
              result: item.result,
              timestamp: item.timestamp
            };
            
            return fetch('/api/analyses/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(apiData)
            });
          });

          const results = await Promise.allSettled(promises);
          const batchUploaded = results.filter(r => r.status === 'fulfilled').length;
          
          uploaded += batchUploaded;
          
          this.log('info', `Uploaded batch ${Math.floor(i/batchSize) + 1}: ${batchUploaded}/${batch.length} items`);
          
        } catch (error) {
          this.log('error', `Failed to upload batch ${Math.floor(i/batchSize) + 1}`, error);
        }
      }

      return { uploaded, totalToUpload: localOnlyItems.length };
      
    } catch (error) {
      this.log('error', 'Failed to upload local-only items', error);
      return { uploaded: 0, totalToUpload: localItems.length };
    }
  }

  /**
   * Stage 4: Merge histories and resolve conflicts
   */
  private async mergeHistories(
    localItems: AnalysisHistoryItem[], 
    remoteItems: AnalysisHistoryItem[], 
    userId: string
  ): Promise<{ totalItems: number; processedItems: number; conflicts: number }> {
    try {
      this.log('info', 'Merging histories and resolving conflicts');
      
      const mergedMap = new Map<string, AnalysisHistoryItem>();
      let conflicts = 0;

      // Add remote items first
      remoteItems.forEach(item => {
        mergedMap.set(item.id, item);
      });

      // Process local items and resolve conflicts
      localItems.forEach(localItem => {
        const existing = mergedMap.get(localItem.id);
        
        if (!existing) {
          // No conflict, add local item
          mergedMap.set(localItem.id, localItem);
        } else {
          // Conflict detected
          conflicts++;
          const resolved = this.resolveConflict(localItem, existing);
          mergedMap.set(localItem.id, resolved);
        }
      });

      const mergedItems = Array.from(mergedMap.values())
        .sort((a, b) => b.timestamp - a.timestamp);

      // Save merged history to database if not dry run
      if (!this.options.dryRun) {
        await this.saveMergedHistory(mergedItems, userId);
      }

      this.log('info', `Merged ${mergedItems.length} items with ${conflicts} conflicts resolved`);
      
      return { 
        totalItems: localItems.length + remoteItems.length, 
        processedItems: mergedItems.length, 
        conflicts 
      };
      
    } catch (error) {
      this.log('error', 'Failed to merge histories', error);
      return { totalItems: 0, processedItems: 0, conflicts: 0 };
    }
  }

  /**
   * Resolve conflict between local and remote items
   */
  private resolveConflict(
    local: AnalysisHistoryItem, 
    remote: AnalysisHistoryItem
  ): AnalysisHistoryItem {
    const resolution = this.options.conflictResolution || 'latest';
    
    switch (resolution) {
      case 'local':
        return local;
      case 'remote':
        return remote;
      case 'latest':
        return local.timestamp > remote.timestamp ? local : remote;
      case 'merge':
        return this.mergeItems(local, remote);
      default:
        return local.timestamp > remote.timestamp ? local : remote;
    }
  }

  /**
   * Merge two conflicting items
   */
  private mergeItems(
    local: AnalysisHistoryItem, 
    remote: AnalysisHistoryItem
  ): AnalysisHistoryItem {
    // Simple merge strategy: prefer latest data, merge fields
    const latest = local.timestamp > remote.timestamp ? local : remote;
    
    return {
      ...latest,
      // Merge result data if both exist
      result: local.result && remote.result ? 
        this.mergeResultData(local.result, remote.result) : 
        latest.result
    };
  }

  /**
   * Merge result data objects
   */
  private mergeResultData(localResult: any, remoteResult: any): any {
    try {
      // Simple merge - prefer non-null values
      const merged = { ...remoteResult };
      
      Object.keys(localResult).forEach(key => {
        if (localResult[key] !== null && localResult[key] !== undefined) {
          merged[key] = localResult[key];
        }
      });
      
      return merged;
    } catch (error) {
      this.log('error', 'Failed to merge result data', error);
      return remoteResult;
    }
  }

  /**
   * Save merged history to database
   */
  private async saveMergedHistory(items: AnalysisHistoryItem[], userId: string): Promise<void> {
    try {
      this.log('info', `Saving ${items.length} merged items to database`);
      
      const batchSize = this.options.batchSize || 10;
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        // Get auth token for batch save
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.access_token) {
          throw new Error('Authentication required: No valid session available');
        }
        
        const token = session.access_token;
        
        const promises = batch.map(item => {
          // Transform data to match API requirements
          const apiData = {
            id: item.id,
            session_id: userId,
            type: item.type,
            input_text: item.input,
            result: item.result,
            timestamp: item.timestamp
          };
          
          return fetch('/api/analyses/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(apiData)
          });
        });

        await Promise.allSettled(promises);
        
        this.log('info', `Saved merged batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(items.length/batchSize)}`);
      }
      
    } catch (error) {
      this.log('error', 'Failed to save merged history', error);
    }
  }

  /**
   * Stage 5: Cleanup
   */
  private async cleanup(): Promise<void> {
    try {
      this.log('info', 'Performing cleanup');
      
      // Clear backup after successful migration
      if (!this.options.dryRun) {
        this.storage?.removeItem(this.localStorageKey);
      }
      
      // Clear migration logs older than 7 days
      const logs = JSON.parse(this.storage?.getItem(this.migrationLogKey) || '[]');
      const recentLogs = logs.filter((log: any) => 
        Date.now() - log.timestamp < 7 * 24 * 60 * 60 * 1000
      );
      
      this.storage?.setItem(this.migrationLogKey, JSON.stringify(recentLogs));
      
    } catch (error) {
      this.log('error', 'Failed to cleanup', error);
    }
  }

  /**
   * Update progress callback
   */
  private updateProgress(progress: MigrationProgress): void {
    this.options.onProgress?.(progress);
    this.log('info', `Progress: ${progress.stage} - ${progress.processed}/${progress.total}`);
  }

  /**
   * Log migration events
   */
  private log(level: 'info' | 'error' | 'warn', message: string, data?: any): void {
    const logEntry = {
      level,
      message,
      data,
      timestamp: Date.now()
    };
    
    try {
      const logs = JSON.parse(this.storage?.getItem(this.migrationLogKey) || '[]');
      logs.push(logEntry);
      
      // Keep only last 100 log entries
      const recentLogs = logs.slice(-100);
      this.storage?.setItem(this.migrationLogKey, JSON.stringify(recentLogs));
      
      console.log(`[HistoryMigration ${level.toUpperCase()}]`, message, data);
    } catch (error) {
      console.error('Failed to log migration event:', error);
    }
  }

  /**
   * Get migration logs
   */
  getLogs(): any[] {
    try {
      return JSON.parse(this.storage?.getItem(this.migrationLogKey) || '[]');
    } catch (error) {
      console.error('Failed to get migration logs:', error);
      return [];
    }
  }

  /**
   * Check if migration is needed
   */
  static needsMigration(): boolean {
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : null;
      if (!storage) return false;
      
      const localStorageKey = 'analysis_history_migration_backup';
      const migrationLogKey = 'history_migration_log';
      
      const backup = storage.getItem(localStorageKey);
      const migrationLog = storage.getItem(migrationLogKey);
      
      // Need migration if no backup exists and no recent successful migration
      return !backup && (!migrationLog || !migrationLog.includes('"success": true'));
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return false;
    }
  }
}

export default HistoryMigration;