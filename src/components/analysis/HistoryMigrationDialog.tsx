import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HistoryMigration, MigrationProgress, MigrationResult } from '@/lib/history-migration';
import { useAuthState } from '@/hooks/stores/use-auth-store';

interface HistoryMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (result: MigrationResult) => void;
}

export function HistoryMigrationDialog({ 
  open, 
  onOpenChange, 
  onComplete 
}: HistoryMigrationDialogProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthState();

  const handleMigration = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsMigrating(true);
    setError(null);
    setResult(null);
    setProgress(null);

    const migration = new HistoryMigration({
      dryRun: false,
      batchSize: 10,
      conflictResolution: 'latest',
      onProgress: (progress) => {
        setProgress(progress);
      },
      onError: (error) => {
        console.error('Migration error:', error);
        setError(`${error.stage}: ${error.error}`);
      },
      onComplete: (result) => {
        setResult(result);
        setIsMigrating(false);
        onComplete?.(result);
      }
    });

    try {
      await migration.execute(user.id);
    } catch (err) {
      console.error('Migration failed:', err);
      setError(err instanceof Error ? err.message : 'Migration failed');
      setIsMigrating(false);
    }
  };

  const getProgressPercentage = () => {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'backup': return 'Backing up local data';
      case 'download': return 'Downloading from database';
      case 'upload': return 'Uploading to database';
      case 'merge': return 'Merging histories';
      case 'cleanup': return 'Cleaning up';
      case 'complete': return 'Migration complete';
      default: return stage;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Migrate History to Database</DialogTitle>
          <DialogDescription>
            Move your local analysis history to the database for cross-device sync and persistence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                    <span className="text-sm">
                      {result.uploaded + result.downloaded + result.merged} items processed
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Duration: {(result.duration / 1000).toFixed(1)}s
                  </div>
                  {result.errors.length > 0 && (
                    <div className="text-xs text-red-600">
                      Errors: {result.errors.join(', ')}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isMigrating && progress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {getStageLabel(progress.stage)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {progress.processed}/{progress.total}
                </span>
              </div>
              
              <Progress value={getProgressPercentage()} className="w-full" />
              
              {progress.current && (
                <p className="text-xs text-muted-foreground">
                  {progress.current}
                </p>
              )}
              
              {progress.error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">
                    {progress.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {!isMigrating && !result && (
            <div className="space-y-3">
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-sm">
                      This migration will:
                    </p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>Backup your local history</li>
                      <li>Download existing database history</li>
                      <li>Upload local-only items to database</li>
                      <li>Merge histories with conflict resolution</li>
                      <li>Cleanup temporary files</li>
                    </ul>
                    <p className="text-sm font-medium pt-2">
                      Your local data will be preserved during this process.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isMigrating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMigration}
                disabled={isMigrating || !user?.id}
              >
                {isMigrating ? 'Migrating...' : 'Start Migration'}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HistoryMigrationDialog;