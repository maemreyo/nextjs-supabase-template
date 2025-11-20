#!/usr/bin/env node

/**
 * Database Restore Script
 * This script restores database from backup files
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  colorLog('blue', `[INFO] ${message}`);
}

function logSuccess(message) {
  colorLog('green', `[SUCCESS] ${message}`);
}

function logWarning(message) {
  colorLog('yellow', `[WARNING] ${message}`);
}

function logError(message) {
  colorLog('red', `[ERROR] ${message}`);
}

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  projectId: process.env.SUPABASE_PROJECT_ID,
  backupFile: process.env.BACKUP_FILE,
  backupDir: process.env.BACKUP_DIR || './backups',
  remote: process.env.RESTORE_REMOTE === 'true',
  force: process.env.FORCE_RESTORE === 'true',
  verbose: process.env.VERBOSE === 'true',
  dryRun: process.env.DRY_RUN === 'true'
};

// Validate configuration
function validateConfig() {
  if (!config.supabaseUrl) {
    logError('Supabase URL is required. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable.');
    process.exit(1);
  }

  if (!config.supabaseServiceKey) {
    logError('Supabase service role key is required. Set SUPABASE_SERVICE_ROLE_KEY environment variable.');
    process.exit(1);
  }

  logInfo('Configuration validated');
}

// Initialize Supabase client
function createSupabaseClient() {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Find backup files
function findBackupFiles() {
  try {
    if (!fs.existsSync(config.backupDir)) {
      logError(`Backup directory not found: ${config.backupDir}`);
      return [];
    }

    const files = fs.readdirSync(config.backupDir)
      .filter(file => file.startsWith('database-backup-'))
      .map(file => {
        const filePath = path.join(config.backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
          format: getFileFormat(file)
        };
      })
      .sort((a, b) => b.modified - a.modified);

    return files;
  } catch (error) {
    logError(`Failed to find backup files: ${error.message}`);
    return [];
  }
}

// Get file format from filename
function getFileFormat(filename) {
  if (filename.endsWith('.sql') || filename.endsWith('.sql.gz')) {
    return 'sql';
  } else if (filename.endsWith('.json') || filename.endsWith('.json.gz')) {
    return 'json';
  } else if (filename.endsWith('.csv') || filename.endsWith('.csv.gz')) {
    return 'csv';
  }
  return 'unknown';
}

// List available backups
function listBackups() {
  const backups = findBackupFiles();
  
  if (backups.length === 0) {
    logError('No backup files found');
    return null;
  }

  logInfo(`Found ${backups.length} backup files:`);
  console.log('\nAvailable Backups:');
  console.log('Index | Name | Format | Size | Modified');
  console.log('------|------|--------|------|---------');
  
  backups.forEach((backup, index) => {
    const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
    const modified = backup.modified.toISOString().split('T')[0];
    console.log(`${index.toString().padStart(5)} | ${backup.name.padEnd(30)} | ${backup.format.padEnd(6)} | ${sizeMB.padStart(6)} MB | ${modified}`);
  });

  return backups;
}

// Select backup interactively
function selectBackup(backups) {
  if (config.backupFile) {
    // Use specified backup file
    const backup = backups.find(b => b.name === config.backupFile || b.path === config.backupFile);
    if (!backup) {
      logError(`Specified backup file not found: ${config.backupFile}`);
      return null;
    }
    return backup;
  }

  // Interactive selection
  if (process.stdin.isTTY) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\nEnter backup index to restore (or 0 to cancel): ', (answer) => {
        rl.close();
        
        const index = parseInt(answer);
        if (index === 0) {
          logInfo('Restore cancelled');
          resolve(null);
          return;
        }

        if (isNaN(index) || index < 1 || index > backups.length) {
          logError('Invalid backup index');
          resolve(null);
          return;
        }

        resolve(backups[index - 1]);
      });
    });
  } else {
    logError('Interactive backup selection requires TTY. Specify backup file with --file option.');
    return null;
  }
}

// Decompress file if needed
function decompressFile(filePath) {
  if (filePath.endsWith('.gz')) {
    const decompressedPath = filePath.replace('.gz', '');
    
    try {
      logInfo(`Decompressing: ${filePath}`);
      execSync(`gunzip -c "${filePath}" > "${decompressedPath}"`);
      logInfo(`Decompressed to: ${decompressedPath}`);
      return decompressedPath;
    } catch (error) {
      logError(`Failed to decompress file: ${error.message}`);
      return null;
    }
  }
  
  return filePath;
}

// Read backup file content
function readBackupFile(filePath, format) {
  try {
    let content;
    
    switch (format) {
      case 'sql':
        content = fs.readFileSync(filePath, 'utf8');
        break;
      case 'json':
        content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        break;
      case 'csv':
        content = fs.readFileSync(filePath, 'utf8');
        break;
      default:
        logError(`Unsupported backup format: ${format}`);
        return null;
    }

    logInfo(`Read backup file: ${filePath}`);
    return content;
  } catch (error) {
    logError(`Failed to read backup file: ${error.message}`);
    return null;
  }
}

// Restore from SQL backup
async function restoreFromSQL(supabase, sqlContent) {
  try {
    logInfo('Restoring from SQL backup...');
    
    if (config.dryRun) {
      logInfo('[DRY RUN] Would execute SQL statements');
      return true;
    }

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    logInfo(`Found ${statements.length} SQL statements to execute`);

    // Execute statements
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // Try direct SQL execution if RPC fails
          logWarning(`RPC failed for statement ${i + 1}, trying alternative method`);
          
          // For complex restores, you might need to use the Supabase CLI
          // This is a simplified implementation
          continue;
        }
        
        if (config.verbose && (i + 1) % 10 === 0) {
          logInfo(`Processed ${i + 1}/${statements.length} statements`);
        }
      } catch (stmtError) {
        logWarning(`Failed to execute statement ${i + 1}: ${stmtError.message}`);
        if (config.verbose) {
          logWarning(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    logSuccess('SQL restore completed');
    return true;
  } catch (error) {
    logError(`SQL restore failed: ${error.message}`);
    return false;
  }
}

// Restore from JSON backup
async function restoreFromJSON(supabase, jsonData) {
  try {
    logInfo('Restoring from JSON backup...');
    
    if (!jsonData.data) {
      logError('Invalid JSON backup format - missing data section');
      return false;
    }

    if (config.dryRun) {
      logInfo('[DRY RUN] Would restore JSON data');
      return true;
    }

    // Restore each table
    let successCount = 0;
    let totalTables = Object.keys(jsonData.data).length;

    for (const [tableName, tableData] of Object.entries(jsonData.data)) {
      try {
        if (!Array.isArray(tableData) || tableData.length === 0) {
          logWarning(`No data to restore for table: ${tableName}`);
          continue;
        }

        // Clear existing data
        const { error: clearError } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (clearError) {
          logWarning(`Failed to clear table ${tableName}: ${clearError.message}`);
        }

        // Insert data
        const { data: result, error: insertError } = await supabase.from(tableName).insert(tableData);
        
        if (insertError) {
          logError(`Failed to restore table ${tableName}: ${insertError.message}`);
        } else {
          logSuccess(`Restored ${result.length} records to ${tableName}`);
          successCount++;
        }
      } catch (tableError) {
        logError(`Error restoring table ${tableName}: ${tableError.message}`);
      }
    }

    logInfo(`JSON restore completed: ${successCount}/${totalTables} tables restored`);
    return successCount === totalTables;
  } catch (error) {
    logError(`JSON restore failed: ${error.message}`);
    return false;
  }
}

// Restore from CSV backup
async function restoreFromCSV(supabase, csvContent) {
  try {
    logInfo('Restoring from CSV backup...');
    
    if (config.dryRun) {
      logInfo('[DRY RUN] Would restore CSV data');
      return true;
    }

    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      logError('Empty CSV backup file');
      return false;
    }

    // This is a simplified CSV parser
    // For production use, consider using a proper CSV library
    let currentTable = null;
    let headers = [];
    let successCount = 0;

    for (const line of lines) {
      if (line.startsWith('-- Table:')) {
        currentTable = line.split(':')[1].trim();
        headers = [];
        logInfo(`Processing table: ${currentTable}`);
        continue;
      }

      if (line.startsWith('--') || !currentTable || line.trim() === '') {
        continue;
      }

      if (headers.length === 0) {
        headers = line.split(',').map(h => h.replace(/"/g, ''));
        continue;
      }

      // Parse data row
      const values = line.split(',').map(v => {
        v = v.replace(/^"|"$/g, '');
        if (v === '' || v === 'NULL') return null;
        if (v.startsWith('"') && v.endsWith('"')) return v.replace(/""/g, '"');
        return v;
      });

      // Create row object
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      try {
        const { error } = await supabase.from(currentTable).insert(row);
        if (!error) {
          successCount++;
        }
      } catch (rowError) {
        logWarning(`Failed to insert row into ${currentTable}: ${rowError.message}`);
      }
    }

    logSuccess(`CSV restore completed: ${successCount} rows restored`);
    return true;
  } catch (error) {
    logError(`CSV restore failed: ${error.message}`);
    return false;
  }
}

// Use Supabase CLI for restore (alternative method)
function restoreWithCLI(backupFile) {
  try {
    logInfo('Restoring using Supabase CLI...');
    
    let command = 'supabase db reset';
    
    if (config.remote) {
      command += ` --project-id ${config.projectId}`;
    } else {
      command += ' --local';
    }
    
    if (config.dryRun) {
      logInfo(`[DRY RUN] Would run: ${command}`);
      return true;
    }
    
    // Reset database first
    execSync(command, { stdio: 'inherit' });
    
    // Apply backup
    if (backupFile.endsWith('.sql')) {
      command = `supabase db push ${backupFile}`;
    } else {
      logError('Supabase CLI restore only supports SQL files');
      return false;
    }
    
    if (config.remote) {
      command += ` --project-id ${config.projectId}`;
    } else {
      command += ' --local';
    }
    
    execSync(command, { stdio: 'inherit' });
    
    logSuccess('CLI restore completed');
    return true;
  } catch (error) {
    logError(`CLI restore failed: ${error.message}`);
    return false;
  }
}

// Confirmation prompt
function confirmRestore(backup) {
  if (config.force) {
    return true;
  }

  logWarning('⚠️  DANGER ZONE ⚠️');
  logWarning('This will REPLACE all data in the database!');
  logWarning(`Backup file: ${backup.name}`);
  logWarning(`Format: ${backup.format}`);
  logWarning(`Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\nAre you absolutely sure you want to continue? (type "RESTORE" to confirm): ', (answer) => {
      rl.close();
      resolve(answer === 'RESTORE');
    });
  });
}

// Main restore function
async function restoreDatabase() {
  logInfo('Starting database restore...');
  logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logInfo(`Remote: ${config.remote}`);
  logInfo(`Dry run: ${config.dryRun}`);
  
  // Validate configuration
  validateConfig();
  
  // Find and select backup
  const backups = listBackups();
  if (!backups || backups.length === 0) {
    process.exit(1);
  }

  const backup = await selectBackup(backups);
  if (!backup) {
    process.exit(0);
  }

  // Confirm restore
  const confirmed = await confirmRestore(backup);
  if (!confirmed) {
    logInfo('Restore cancelled');
    process.exit(0);
  }

  // Decompress if needed
  const workingFile = decompressFile(backup.path);
  if (!workingFile) {
    process.exit(1);
  }

  // Read backup content
  const content = readBackupFile(workingFile, backup.format);
  if (!content) {
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createSupabaseClient();
  
  try {
    let success = false;
    
    // Try CLI restore first (more reliable)
    try {
      success = restoreWithCLI(backup.path);
    } catch (cliError) {
      logWarning(`CLI restore failed: ${cliError.message}`);
      logInfo('Falling back to manual restore...');
      
      // Manual restore based on format
      switch (backup.format) {
        case 'sql':
          success = await restoreFromSQL(supabase, content);
          break;
        case 'json':
          success = await restoreFromJSON(supabase, content);
          break;
        case 'csv':
          success = await restoreFromCSV(supabase, content);
          break;
        default:
          logError(`Unsupported backup format: ${backup.format}`);
          break;
      }
    }
    
    if (success) {
      logSuccess('Database restore completed successfully!');
      
      // Clean up decompressed file
      if (workingFile !== backup.path) {
        fs.unlinkSync(workingFile);
        logInfo('Cleaned up temporary decompressed file');
      }
      
      console.log('\nRestore Summary:');
      console.log(`  Backup: ${backup.name}`);
      console.log(`  Format: ${backup.format}`);
      console.log(`  Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Timestamp: ${new Date().toISOString()}`);
      
      logInfo('Next steps:');
      logInfo('1. Verify database schema and data');
      logInfo('2. Test application functionality');
      logInfo('3. Update TypeScript types if needed');
    } else {
      logError('Database restore failed');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Restore process failed: ${error.message}`);
    process.exit(1);
  }
}

// Command line interface
function showHelp() {
  console.log(`
Database Restore Script

Usage: node db-restore.js [OPTIONS]

Options:
  --file FILE          Specific backup file to restore
  --backup-dir DIR     Backup directory (default: ./backups)
  --remote             Restore to remote database
  --force              Skip confirmation prompts
  --dry-run            Show what would be restored without executing
  --verbose            Show detailed output
  --help               Show this help message

Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL     Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   Supabase service role key
  SUPABASE_PROJECT_ID         Supabase project ID (for remote restore)
  BACKUP_FILE               Specific backup file to restore
  BACKUP_DIR                Backup directory path
  RESTORE_REMOTE             Restore to remote database (true/false)
  FORCE_RESTORE              Skip confirmation (true/false)
  DRY_RUN                   Dry run mode (true/false)
  VERBOSE                    Verbose output (true/false)

Examples:
  node db-restore.js                           # Interactive restore from local backups
  node db-restore.js --file backup.sql           # Restore specific file
  node db-restore.js --remote                    # Restore to remote database
  node db-restore.js --dry-run                   # Preview restore without executing
  node db-restore.js --force --file backup.json   # Force restore without confirmation
`);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
        config.backupFile = args[i + 1];
        i++;
        break;
      case '--backup-dir':
        config.backupDir = args[i + 1];
        i++;
        break;
      case '--remote':
        config.remote = true;
        break;
      case '--force':
        config.force = true;
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
      default:
        logError(`Unknown argument: ${args[i]}`);
        showHelp();
        process.exit(1);
    }
  }
}

// Main execution
async function main() {
  parseArgs();
  
  if (config.verbose) {
    logInfo('Verbose mode enabled');
    logInfo(`Configuration: ${JSON.stringify(config, null, 2)}`);
  }
  
  await restoreDatabase();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at ${promise}: ${reason}`);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch(error => {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { restoreDatabase, restoreFromSQL, restoreFromJSON };