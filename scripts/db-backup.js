#!/usr/bin/env node

/**
 * Database Backup Script
 * This script creates backups of the Supabase database
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
  backupDir: process.env.BACKUP_DIR || './backups',
  backupFormat: process.env.BACKUP_FORMAT || 'sql', // sql, json, csv
  compression: process.env.COMPRESSION !== 'false', // gzip compression
  includeData: process.env.INCLUDE_DATA !== 'false', // include data or schema only
  tables: process.env.TABLES ? process.env.TABLES.split(',') : null, // specific tables or all
  excludeTables: process.env.EXCLUDE_TABLES ? process.env.EXCLUDE_TABLES.split(',') : [],
  verbose: process.env.VERBOSE === 'true',
  remote: process.env.REMOTE_BACKUP === 'true' // backup remote database
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

// Create backup directory
function ensureBackupDir() {
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    logInfo(`Created backup directory: ${config.backupDir}`);
  }
}

// Generate backup filename
function generateBackupFilename(format, suffix = '') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `database-backup-${timestamp}${suffix ? `-${suffix}` : ''}`;
  
  switch (format) {
    case 'sql':
      return `${baseName}.sql${config.compression ? '.gz' : ''}`;
    case 'json':
      return `${baseName}.json${config.compression ? '.gz' : ''}`;
    case 'csv':
      return `${baseName}.csv${config.compression ? '.gz' : ''}`;
    default:
      return `${baseName}.sql${config.compression ? '.gz' : ''}`;
  }
}

// Get list of all tables
async function getTableList(supabase) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations');

    if (error) {
      throw error;
    }

    const tables = data.map(row => row.table_name);
    
    // Filter tables based on configuration
    let filteredTables = tables;
    
    if (config.tables) {
      filteredTables = tables.filter(table => config.tables.includes(table));
    }
    
    if (config.excludeTables.length > 0) {
      filteredTables = filteredTables.filter(table => !config.excludeTables.includes(table));
    }

    return filteredTables;
  } catch (error) {
    logError(`Failed to get table list: ${error.message}`);
    return [];
  }
}

// Export table data
async function exportTableData(supabase, tableName) {
  try {
    let query = supabase.from(tableName).select('*');
    
    // For large tables, you might want to implement pagination
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logError(`Failed to export table ${tableName}: ${error.message}`);
    return [];
  }
}

// Create SQL backup
async function createSQLBackup(supabase, tables) {
  const filename = generateBackupFilename('sql');
  const filepath = path.join(config.backupDir, filename);
  
  logInfo(`Creating SQL backup: ${filename}`);
  
  try {
    let sqlContent = `-- Database Backup
-- Generated on: ${new Date().toISOString()}
-- Database: ${config.supabaseUrl}
-- Tables: ${tables.join(', ')}

`;

    // Add schema information
    sqlContent += `
-- Schema Information
`;

    for (const table of tables) {
      // Get table schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', table)
        .order('ordinal_position');

      if (schemaError) {
        logWarning(`Could not get schema for table ${table}: ${schemaError.message}`);
        continue;
      }

      sqlContent += `
-- Table: ${table}
CREATE TABLE IF NOT EXISTS ${table} (
`;

      const columns = schemaData.map(col => {
        const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        return `  ${col.column_name} ${col.data_type}${nullable}${defaultVal}`;
      });

      sqlContent += columns.join(',\n');
      sqlContent += '\n);\n\n';
    }

    // Add data if requested
    if (config.includeData) {
      sqlContent += `
-- Data
`;

      for (const table of tables) {
        const data = await exportTableData(supabase, table);
        
        if (data.length === 0) {
          continue;
        }

        sqlContent += `-- Data for table: ${table}\n`;

        for (const row of data) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });

          sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }

        sqlContent += '\n';
      }
    }

    // Write to file
    fs.writeFileSync(filepath, sqlContent);
    
    // Compress if requested
    if (config.compression) {
      const compressedPath = `${filepath}.gz`;
      execSync(`gzip -c "${filepath}" > "${compressedPath}"`);
      fs.unlinkSync(filepath);
      return compressedPath;
    }

    return filepath;
  } catch (error) {
    logError(`Failed to create SQL backup: ${error.message}`);
    return null;
  }
}

// Create JSON backup
async function createJSONBackup(supabase, tables) {
  const filename = generateBackupFilename('json');
  const filepath = path.join(config.backupDir, filename);
  
  logInfo(`Creating JSON backup: ${filename}`);
  
  try {
    const backupData = {
      metadata: {
        generated_on: new Date().toISOString(),
        database_url: config.supabaseUrl,
        tables: tables,
        include_data: config.includeData,
        format: 'json'
      },
      schema: {},
      data: {}
    };

    // Get schema information
    for (const table of tables) {
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', table)
        .order('ordinal_position');

      if (!schemaError) {
        backupData.schema[table] = schemaData;
      }
    }

    // Get data if requested
    if (config.includeData) {
      for (const table of tables) {
        const data = await exportTableData(supabase, table);
        backupData.data[table] = data;
      }
    }

    // Write to file
    const jsonContent = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filepath, jsonContent);
    
    // Compress if requested
    if (config.compression) {
      const compressedPath = `${filepath}.gz`;
      execSync(`gzip -c "${filepath}" > "${compressedPath}"`);
      fs.unlinkSync(filepath);
      return compressedPath;
    }

    return filepath;
  } catch (error) {
    logError(`Failed to create JSON backup: ${error.message}`);
    return null;
  }
}

// Create CSV backup
async function createCSVBackup(supabase, tables) {
  const filename = generateBackupFilename('csv');
  const filepath = path.join(config.backupDir, filename);
  
  logInfo(`Creating CSV backup: ${filename}`);
  
  try {
    let csvContent = '';
    
    for (const table of tables) {
      const data = await exportTableData(supabase, table);
      
      if (data.length === 0) {
        continue;
      }

      csvContent += `-- Table: ${table}\n`;
      
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        csvContent += headers.join(',') + '\n';
        
        for (const row of data) {
          const values = headers.map(header => {
            const val = row[header];
            if (val === null) return '';
            if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
            if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            return val;
          });
          csvContent += values.join(',') + '\n';
        }
      }
      
      csvContent += '\n';
    }

    // Write to file
    fs.writeFileSync(filepath, csvContent);
    
    // Compress if requested
    if (config.compression) {
      const compressedPath = `${filepath}.gz`;
      execSync(`gzip -c "${filepath}" > "${compressedPath}"`);
      fs.unlinkSync(filepath);
      return compressedPath;
    }

    return filepath;
  } catch (error) {
    logError(`Failed to create CSV backup: ${error.message}`);
    return null;
  }
}

// Use Supabase CLI for backup (alternative method)
function createSupabaseBackup() {
  try {
    const filename = generateBackupFilename('sql', 'supabase-cli');
    const filepath = path.join(config.backupDir, filename);
    
    logInfo('Creating backup using Supabase CLI...');
    
    let command = 'supabase db dump';
    
    if (config.remote) {
      command += ` --project-id ${config.projectId}`;
    } else {
      command += ' --local';
    }
    
    if (!config.includeData) {
      command += ' --schema-only';
    }
    
    if (config.compression) {
      command += ` | gzip > "${filepath}.gz"`;
    } else {
      command += ` > "${filepath}"`;
    }
    
    execSync(command, { stdio: 'inherit' });
    
    return config.compression ? `${filepath}.gz` : filepath;
  } catch (error) {
    logError(`Supabase CLI backup failed: ${error.message}`);
    return null;
  }
}

// Get file size
function getFileSize(filepath) {
  try {
    const stats = fs.statSync(filepath);
    return (stats.size / 1024 / 1024).toFixed(2); // Size in MB
  } catch (error) {
    return 'Unknown';
  }
}

// Main backup function
async function createBackup() {
  logInfo('Starting database backup...');
  logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logInfo(`Format: ${config.backupFormat}`);
  logInfo(`Include data: ${config.includeData}`);
  logInfo(`Compression: ${config.compression}`);
  
  // Validate configuration
  validateConfig();
  
  // Create backup directory
  ensureBackupDir();
  
  // Create Supabase client
  const supabase = createSupabaseClient();
  
  try {
    let backupFile = null;
    
    // Try Supabase CLI first (more reliable)
    try {
      backupFile = createSupabaseBackup();
    } catch (cliError) {
      logWarning(`Supabase CLI backup failed: ${cliError.message}`);
      logInfo('Falling back to manual backup...');
      
      // Get table list
      const tables = await getTableList(supabase);
      
      if (tables.length === 0) {
        logWarning('No tables found to backup');
        return;
      }
      
      logInfo(`Found ${tables.length} tables: ${tables.join(', ')}`);
      
      // Create backup based on format
      switch (config.backupFormat) {
        case 'json':
          backupFile = await createJSONBackup(supabase, tables);
          break;
        case 'csv':
          backupFile = await createCSVBackup(supabase, tables);
          break;
        case 'sql':
        default:
          backupFile = await createSQLBackup(supabase, tables);
          break;
      }
    }
    
    if (backupFile) {
      const fileSize = getFileSize(backupFile);
      logSuccess(`Backup created: ${backupFile}`);
      logInfo(`File size: ${fileSize} MB`);
      
      // Show backup summary
      console.log('\nBackup Summary:');
      console.log(`  File: ${backupFile}`);
      console.log(`  Size: ${fileSize} MB`);
      console.log(`  Format: ${config.backupFormat}`);
      console.log(`  Compressed: ${config.compression}`);
      console.log(`  Timestamp: ${new Date().toISOString()}`);
      
      return backupFile;
    } else {
      logError('Backup failed');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Backup process failed: ${error.message}`);
    process.exit(1);
  }
}

// Clean old backups
function cleanOldBackups() {
  const maxBackups = parseInt(process.env.MAX_BACKUPS) || 10;
  
  try {
    const files = fs.readdirSync(config.backupDir)
      .filter(file => file.startsWith('database-backup-'))
      .map(file => ({
        name: file,
        path: path.join(config.backupDir, file),
        time: fs.statSync(path.join(config.backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length > maxBackups) {
      const filesToDelete = files.slice(maxBackups);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        logInfo(`Deleted old backup: ${file.name}`);
      }
      
      logInfo(`Cleaned up ${filesToDelete.length} old backups`);
    }
  } catch (error) {
    logWarning(`Failed to clean old backups: ${error.message}`);
  }
}

// Command line interface
function showHelp() {
  console.log(`
Database Backup Script

Usage: node db-backup.js [OPTIONS]

Options:
  --format FORMAT        Backup format: sql, json, csv (default: sql)
  --no-compression      Disable compression
  --schema-only         Backup schema only (no data)
  --tables TABLES       Comma-separated list of tables to backup
  --exclude TABLES      Comma-separated list of tables to exclude
  --backup-dir DIR      Backup directory (default: ./backups)
  --max-backups NUM     Maximum number of backups to keep (default: 10)
  --remote             Backup remote database
  --verbose            Show detailed output
  --help               Show this help message

Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL     Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   Supabase service role key
  SUPABASE_PROJECT_ID         Supabase project ID (for remote backups)
  BACKUP_FORMAT              Backup format (sql, json, csv)
  COMPRESSION                Enable compression (true/false, default: true)
  INCLUDE_DATA               Include data in backup (true/false, default: true)
  BACKUP_DIR                Backup directory path
  TABLES                    Comma-separated table list
  EXCLUDE_TABLES             Comma-separated tables to exclude
  MAX_BACKUPS               Maximum backups to keep
  REMOTE_BACKUP              Backup remote database (true/false)
  VERBOSE                    Verbose output (true/false)

Examples:
  node db-backup.js                           # Backup with default settings
  node db-backup.js --format json             # JSON format backup
  node db-backup.js --schema-only             # Schema only backup
  node db-backup.js --tables users,profiles   # Backup specific tables
  node db-backup.js --no-compression          # Disable compression
  node db-backup.js --remote                  # Backup remote database
`);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--format':
        config.backupFormat = args[i + 1];
        i++;
        break;
      case '--no-compression':
        config.compression = false;
        break;
      case '--schema-only':
        config.includeData = false;
        break;
      case '--tables':
        config.tables = args[i + 1].split(',');
        i++;
        break;
      case '--exclude':
        config.excludeTables = args[i + 1].split(',');
        i++;
        break;
      case '--backup-dir':
        config.backupDir = args[i + 1];
        i++;
        break;
      case '--max-backups':
        process.env.MAX_BACKUPS = args[i + 1];
        i++;
        break;
      case '--remote':
        config.remote = true;
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
  
  const backupFile = await createBackup();
  
  // Clean old backups
  cleanOldBackups();
  
  logInfo('Backup process completed');
  logInfo(`Backup file: ${backupFile}`);
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

module.exports = { createBackup, createSQLBackup, createJSONBackup };