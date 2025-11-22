import { AnalysisHistoryItem } from './history-cache-manager';
import { generateUUID } from './uuid';

export interface PendingOperation {
  type: 'add' | 'update' | 'delete';
  data: any;
  timestamp: number;
  id: string;
  retryCount?: number;
}

export interface OfflineConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  enableBackgroundSync: boolean;
  syncInterval: number; // in milliseconds
}

export interface SyncStatus {
  isOnline: boolean;
  pendingOperations: number;
  lastSyncAttempt: number;
  lastSuccessfulSync: number;
  failedOperations: number;
}

/**
 * Offline history manager for handling operations when offline
 * and syncing when back online
 */
export class OfflineHistoryManager {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private pendingOperations: PendingOperation[] = [];
  private failedOperations: PendingOperation[] = [];
  private readonly config: OfflineConfig;
  private syncInProgress = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private status: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingOperations: 0,
    lastSyncAttempt: 0,
    lastSuccessfulSync: 0,
    failedOperations: 0
  };

  private readonly storageKey = 'offline_history_operations_v2';
  private readonly statusKey = 'offline_sync_status_v2';

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      batchSize: 10,
      enableBackgroundSync: true,
      syncInterval: 30000, // 30 seconds
      ...config
    };

    this.initialize();
  }

  private initialize(): void {
    // Load pending operations from localStorage
    this.loadPendingOperations();
    
    // Setup online/offline event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
    
    // Setup periodic sync if enabled
    if (this.config.enableBackgroundSync) {
      this.setupPeriodicSync();
    }

    // Update status
    this.updateStatus();
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.status.isOnline = true;
    this.updateStatus();
    
    console.log('🌐 Network is online - starting sync process');
    
    // Start sync process with a small delay to ensure network is stable
    setTimeout(() => {
      this.processPendingOperations();
    }, 1000);
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.status.isOnline = false;
    this.updateStatus();
    
    console.log('📵 Network is offline - operations will be queued');
  }

  private setupPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.pendingOperations.length > 0) {
        this.processPendingOperations();
      }
    }, this.config.syncInterval);
  }

  // Public methods for managing operations
  async addToHistory(item: AnalysisHistoryItem): Promise<void> {
    const operation: PendingOperation = {
      type: 'add',
      data: item,
      timestamp: Date.now(),
      id: `add-${generateUUID()}`,
      retryCount: 0
    };

    if (this.isOnline) {
      try {
        // Try to save immediately if online
        await this.executeOperation(operation);
        this.removePendingOperation(operation.id);
      } catch (error) {
        console.warn('Failed to save immediately, queuing for later:', error);
        this.addPendingOperation(operation);
      }
    } else {
      // Queue for when online
      this.addPendingOperation(operation);
    }
  }

  async updateHistory(item: AnalysisHistoryItem): Promise<void> {
    const operation: PendingOperation = {
      type: 'update',
      data: item,
      timestamp: Date.now(),
      id: `update-${generateUUID()}`,
      retryCount: 0
    };

    if (this.isOnline) {
      try {
        await this.executeOperation(operation);
        this.removePendingOperation(operation.id);
      } catch (error) {
        console.warn('Failed to update immediately, queuing for later:', error);
        this.addPendingOperation(operation);
      }
    } else {
      this.addPendingOperation(operation);
    }
  }

  async removeFromHistory(itemId: string): Promise<void> {
    const operation: PendingOperation = {
      type: 'delete',
      data: { id: itemId },
      timestamp: Date.now(),
      id: `delete-${generateUUID()}`,
      retryCount: 0
    };

    if (this.isOnline) {
      try {
        await this.executeOperation(operation);
        this.removePendingOperation(operation.id);
      } catch (error) {
        console.warn('Failed to delete immediately, queuing for later:', error);
        this.addPendingOperation(operation);
      }
    } else {
      this.addPendingOperation(operation);
    }
  }

  // Process pending operations
  async processPendingOperations(): Promise<void> {
    if (this.syncInProgress || this.pendingOperations.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.status.lastSyncAttempt = Date.now();
    this.updateStatus();

    console.log(`🔄 Processing ${this.pendingOperations.length} pending operations`);

    try {
      // Process operations in batches
      const batches = this.createBatches(this.pendingOperations, this.config.batchSize);
      
      for (const batch of batches) {
        await this.processBatch(batch);
        
        // Small delay between batches to avoid overwhelming the server
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Clean up successful operations
      this.cleanupSuccessfulOperations();
      
      this.status.lastSuccessfulSync = Date.now();
      console.log('✅ Sync completed successfully');

    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.status.failedOperations = this.failedOperations.length;
    } finally {
      this.syncInProgress = false;
      this.updateStatus();
    }
  }

  private async processBatch(operations: PendingOperation[]): Promise<void> {
    const promises = operations.map(operation => 
      this.executeOperation(operation).catch(error => {
        console.warn(`Operation failed: ${operation.id}`, error);
        operation.retryCount = (operation.retryCount || 0) + 1;
        
        if (operation.retryCount! >= this.config.maxRetries) {
          this.failedOperations.push(operation);
        }
        
        return { success: false, operation, error };
      })
    );

    const results = await Promise.allSettled(promises);
    
    // Handle results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // Operation succeeded, remove from pending
        const operationId = operations[index]?.id;
        if (operationId) {
          this.removePendingOperation(operationId);
        }
      }
    });
  }

  private async executeOperation(operation: PendingOperation): Promise<any> {
    switch (operation.type) {
      case 'add':
        return this.executeAddOperation(operation.data);
      case 'update':
        return this.executeUpdateOperation(operation.data);
      case 'delete':
        return this.executeDeleteOperation(operation.data);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async executeAddOperation(item: AnalysisHistoryItem): Promise<any> {
    // Get auth token from Supabase session
    const { supabase } = await import('@/lib/supabase/client');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      throw new Error('Authentication required: No valid session available');
    }
    
    const token = session.access_token;
    
    // Get current session ID
    const sessionId = session.user?.id || generateUUID();
    
    // Transform data to match API requirements
    const apiData = {
      id: item.id,
      session_id: sessionId,
      type: item.type,
      input_text: item.input,
      result: item.result,
      timestamp: item.timestamp
    };
    
    const response = await fetch('/api/analyses/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(apiData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Add operation failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async executeUpdateOperation(item: AnalysisHistoryItem): Promise<any> {
    // Get auth token from Supabase session
    const { supabase } = await import('@/lib/supabase/client');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      throw new Error('Authentication required: No valid session available');
    }
    
    const token = session.access_token;
    
    const response = await fetch(`/api/analyses/${item.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(item)
    });

    if (!response.ok) {
      throw new Error(`Update operation failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async executeDeleteOperation(data: { id: string }): Promise<any> {
    // Get auth token from Supabase session
    const { supabase } = await import('@/lib/supabase/client');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      throw new Error('Authentication required: No valid session available');
    }
    
    const token = session.access_token;
    
    const response = await fetch(`/api/analyses/${data.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Delete operation failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Storage management
  private loadPendingOperations(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const { operations, timestamp } = JSON.parse(stored);
        
        // Only load operations if they're less than 7 days old
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (timestamp > weekAgo) {
          this.pendingOperations = operations;
        } else {
          // Clear old operations
          localStorage.removeItem(this.storageKey);
        }
      }
    } catch (error) {
      console.warn('Failed to load pending operations:', error);
    }
  }

  private savePendingOperations(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const data = {
        operations: this.pendingOperations,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.status.pendingOperations = this.pendingOperations.length;
    } catch (error) {
      console.warn('Failed to save pending operations:', error);
    }
  }

  private addPendingOperation(operation: PendingOperation): void {
    this.pendingOperations.push(operation);
    this.savePendingOperations();
  }

  private removePendingOperation(operationId: string): void {
    this.pendingOperations = this.pendingOperations.filter(op => op.id !== operationId);
    this.savePendingOperations();
  }

  private cleanupSuccessfulOperations(): void {
    // Remove operations that have succeeded
    this.pendingOperations = this.pendingOperations.filter(op => 
      op.retryCount! < this.config.maxRetries
    );
    
    // Move failed operations to failed array
    this.failedOperations.push(...this.pendingOperations.filter(op => 
      op.retryCount! >= this.config.maxRetries
    ));
    
    this.pendingOperations = this.pendingOperations.filter(op => 
      op.retryCount! < this.config.maxRetries
    );
    
    this.savePendingOperations();
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private updateStatus(): void {
    this.status.pendingOperations = this.pendingOperations.length;
    this.status.failedOperations = this.failedOperations.length;
    
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(this.statusKey, JSON.stringify(this.status));
    } catch (error) {
      console.warn('Failed to save sync status:', error);
    }
  }

  // Public utility methods
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  getPendingOperations(): PendingOperation[] {
    return [...this.pendingOperations];
  }

  getFailedOperations(): PendingOperation[] {
    return [...this.failedOperations];
  }

  async retryFailedOperations(): Promise<void> {
    if (this.failedOperations.length === 0) {
      return;
    }

    console.log(`🔄 Retrying ${this.failedOperations.length} failed operations`);
    
    // Move failed operations back to pending
    this.pendingOperations.push(...this.failedOperations);
    this.failedOperations = [];
    
    // Reset retry counts
    this.pendingOperations.forEach(op => {
      op.retryCount = 0;
    });
    
    this.savePendingOperations();
    this.updateStatus();
    
    // Process them
    await this.processPendingOperations();
  }

  clearAllOperations(): void {
    this.pendingOperations = [];
    this.failedOperations = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
    this.updateStatus();
  }

  forceSync(): Promise<void> {
    return this.processPendingOperations();
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
  }
}

// Singleton instance
export const offlineHistoryManager = new OfflineHistoryManager();