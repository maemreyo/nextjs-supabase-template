#!/usr/bin/env node

/**
 * Database Seeding Script
 * This script seeds the database with sample data for development and testing
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
  seedDataPath: process.env.SEED_DATA_PATH || './scripts/seed-data.json',
  environment: process.env.NODE_ENV || 'development',
  resetBeforeSeed: process.env.RESET_BEFORE_SEED === 'true',
  verbose: process.env.VERBOSE === 'true'
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

// Load seed data from file
function loadSeedData() {
  try {
    if (fs.existsSync(config.seedDataPath)) {
      const seedData = JSON.parse(fs.readFileSync(config.seedDataPath, 'utf8'));
      logInfo(`Loaded seed data from ${config.seedDataPath}`);
      return seedData;
    } else {
      logWarning(`Seed data file not found: ${config.seedDataPath}`);
      return generateDefaultSeedData();
    }
  } catch (error) {
    logError(`Failed to load seed data: ${error.message}`);
    return generateDefaultSeedData();
  }
}

// Generate default seed data
function generateDefaultSeedData() {
  logInfo('Generating default seed data...');
  
  const now = new Date().toISOString();
  
  return {
    users: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: now
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'teacher@example.com',
        name: 'Teacher User',
        role: 'teacher',
        created_at: now
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'student@example.com',
        name: 'Student User',
        role: 'student',
        created_at: now
      }
    ],
    
    profiles: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Admin User',
        avatar_url: 'https://ui-avatars.com/api/?name=Admin+User&background=random',
        bio: 'System administrator',
        created_at: now
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000002',
        full_name: 'Teacher User',
        avatar_url: 'https://ui-avatars.com/api/?name=Teacher+User&background=random',
        bio: 'Experienced teacher',
        created_at: now
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        user_id: '00000000-0000-0000-0000-000000000003',
        full_name: 'Student User',
        avatar_url: 'https://ui-avatars.com/api/?name=Student+User&background=random',
        bio: 'Eager student',
        created_at: now
      }
    ],
    
    // Add more tables as needed for your application
    categories: [
      {
        id: 1,
        name: 'Reading Comprehension',
        description: 'Practice reading and understanding texts',
        created_at: now
      },
      {
        id: 2,
        name: 'Vocabulary',
        description: 'Build your vocabulary',
        created_at: now
      },
      {
        id: 3,
        name: 'Grammar',
        description: 'Improve your grammar skills',
        created_at: now
      }
    ],
    
    exercises: [
      {
        id: 1,
        title: 'Reading Passage 1',
        content: 'This is a sample reading passage for testing purposes...',
        category_id: 1,
        difficulty: 'intermediate',
        created_at: now
      },
      {
        id: 2,
        title: 'Vocabulary Exercise 1',
        content: 'Match the words with their definitions...',
        category_id: 2,
        difficulty: 'beginner',
        created_at: now
      }
    ]
  };
}

// Reset database before seeding (optional)
async function resetDatabase(supabase) {
  if (!config.resetBeforeSeed) {
    return;
  }

  logWarning('Resetting database before seeding...');
  
  try {
    // Note: Be very careful with this in production!
    // This is a simplified reset - you might want more sophisticated logic
    
    const tables = ['profiles', 'exercises', 'categories', 'users'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        logWarning(`Failed to clear table ${table}: ${error.message}`);
      } else {
        logInfo(`Cleared table: ${table}`);
      }
    }
    
    logSuccess('Database reset completed');
  } catch (error) {
    logError(`Database reset failed: ${error.message}`);
  }
}

// Seed data to database
async function seedTable(supabase, tableName, data) {
  if (!data || data.length === 0) {
    logWarning(`No data to seed for table: ${tableName}`);
    return;
  }

  try {
    const { data: result, error } = await supabase.from(tableName).insert(data);
    
    if (error) {
      logError(`Failed to seed ${tableName}: ${error.message}`);
      return false;
    }
    
    logSuccess(`Seeded ${result.length} records into ${tableName}`);
    return true;
  } catch (error) {
    logError(`Error seeding ${tableName}: ${error.message}`);
    return false;
  }
}

// Main seeding function
async function seedDatabase() {
  logInfo('Starting database seeding...');
  logInfo(`Environment: ${config.environment}`);
  logInfo(`Reset before seed: ${config.resetBeforeSeed}`);
  
  // Validate configuration
  validateConfig();
  
  // Create Supabase client
  const supabase = createSupabaseClient();
  
  try {
    // Test connection
    const { data, error } = await supabase.from('auth.users').select('count').single();
    if (error && error.code !== 'PGRST116') { // PGRST116 is okay for empty result
      logError(`Failed to connect to database: ${error.message}`);
      process.exit(1);
    }
    
    logSuccess('Database connection established');
    
    // Reset database if requested
    await resetDatabase(supabase);
    
    // Load seed data
    const seedData = loadSeedData();
    
    // Seed each table
    let successCount = 0;
    let totalTables = Object.keys(seedData).length;
    
    for (const [tableName, data] of Object.entries(seedData)) {
      if (await seedTable(supabase, tableName, data)) {
        successCount++;
      }
    }
    
    // Show summary
    logInfo(`Seeding completed: ${successCount}/${totalTables} tables seeded successfully`);
    
    if (successCount === totalTables) {
      logSuccess('Database seeding completed successfully!');
    } else {
      logWarning('Some tables failed to seed. Check the logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
}

// Generate seed data file template
function generateSeedDataTemplate() {
  const template = {
    users: [
      {
        // id: 'uuid',
        email: 'user@example.com',
        name: 'User Name',
        created_at: '2023-01-01T00:00:00Z'
      }
    ],
    
    // Add your tables here
    // table_name: [
    //   {
    //     // column: value
    //   }
    // ]
  };
  
  const templatePath = './scripts/seed-data.json';
  
  try {
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    logSuccess(`Seed data template created: ${templatePath}`);
    logInfo('Edit this file with your custom seed data');
  } catch (error) {
    logError(`Failed to create seed data template: ${error.message}`);
  }
}

// Command line interface
function showHelp() {
  console.log(`
Database Seeding Script

Usage: node db-seed.js [OPTIONS]

Options:
  --reset                 Reset database before seeding
  --template              Generate seed data template file
  --data-path PATH         Path to custom seed data file (default: ./scripts/seed-data.json)
  --verbose               Show detailed output
  --help                  Show this help message

Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL     Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   Supabase service role key (required for seeding)
  RESET_BEFORE_SEED          Set to 'true' to reset database before seeding
  VERBOSE                   Set to 'true' for detailed output

Examples:
  node db-seed.js                           # Seed with default data
  node db-seed.js --reset                    # Reset and seed
  node db-seed.js --template                  # Generate template file
  node db-seed.js --data-path ./custom.json   # Use custom seed data
  RESET_BEFORE_SEED=true node db-seed.js      # Reset and seed via env var
`);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--reset':
        config.resetBeforeSeed = true;
        break;
      case '--template':
        generateSeedDataTemplate();
        process.exit(0);
        break;
      case '--data-path':
        config.seedDataPath = args[i + 1];
        i++;
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
  
  await seedDatabase();
  
  logInfo('Seeding process completed');
  logInfo('You can now start the development server: npm run dev');
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

module.exports = { seedDatabase, generateDefaultSeedData };