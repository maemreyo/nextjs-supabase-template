#!/usr/bin/env node

/**
 * API Refactor Helper Script
 * 
 * This script helps to systematically refactor API routes to use the new authentication pattern.
 * It can be used to:
 * 1. Identify routes that need refactoring
 * 2. Generate refactored versions automatically
 * 3. Create backup of original files
 * 4. Validate refactored code
 */

const fs = require('fs').promises;
const path = require('path');

// API routes that need refactoring
const API_ROUTES_TO_REFACTOR = [
  // AI APIs
  'src/app/api/ai/generate-text/route.ts',
  'src/app/api/ai/check-usage/route.ts',
  'src/app/api/ai/generate-embedding/route.ts',
  'src/app/api/ai/models/route.ts',
  'src/app/api/ai/provider-status/route.ts',
  
  // Session APIs
  'src/app/api/sessions/[id]/route.ts',
  'src/app/api/sessions/[id]/analyses/route.ts',
  'src/app/api/sessions/[id]/analytics/route.ts',
  'src/app/api/sessions/[id]/export/route.ts',
  'src/app/api/sessions/[id]/rename/route.ts',
  'src/app/api/sessions/[id]/settings/route.ts',
  'src/app/api/sessions/recent/route.ts',
  'src/app/api/sessions/search/route.ts',
  
  // Analysis APIs
  'src/app/api/analyses/list/route.ts',
  'src/app/api/analyses/[id]/route.ts',
  
  // Vocabulary APIs
  'src/app/api/vocabulary/collections/[id]/route.ts',
  'src/app/api/vocabulary/collections/[id]/words/route.ts',
  'src/app/api/vocabulary/words/[id]/route.ts',
];

// Template for refactored API route
const REFACTORED_TEMPLATE = `import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';

export const METHOD_NAME = withAuth(
  async (request: NextRequest, { user, supabase }: { user: any; supabase: any }) => {
    try {
      // TODO: Replace manual authentication with business logic
      
      // TODO: Replace NextResponse.json() with createSuccessResponse()
      // TODO: Replace error responses with createErrorResponse()
      
    } catch (error) {
      console.error('Error in API_NAME:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);`;

/**
 * Generate refactored version of an API route
 */
async function refactorRoute(filePath) {
  try {
    console.log(`🔄 Refactoring: ${filePath}`);
    
    // Read original file
    const originalContent = await fs.readFile(filePath, 'utf8');
    
    // Extract method name (GET, POST, PATCH, etc.)
    const methodMatch = originalContent.match(/export (?:async )?function (\w+)/);
    const methodName = methodMatch ? methodMatch[1] : 'METHOD';
    
    // Extract API name from file path
    const apiName = path.basename(path.dirname(filePath));
    
    // Generate refactored content
    let refactoredContent = REFACTORED_TEMPLATE
      .replace(/METHOD_NAME/g, methodName)
      .replace(/API_NAME/g, apiName);
    
    // Add TODO comments for manual review
    refactoredContent = `// TODO: Review and implement business logic\n${refactoredContent}`;
    
    // Create backup
    const backupPath = filePath.replace('.ts', '.original.ts');
    await fs.writeFile(backupPath, originalContent);
    
    // Write refactored version
    await fs.writeFile(filePath, refactoredContent);
    
    console.log(`✅ Refactored: ${filePath}`);
    console.log(`📁 Backup created: ${backupPath}`);
    
    return { success: true, filePath, backupPath };
    
  } catch (error) {
    console.error(`❌ Failed to refactor ${filePath}:`, error.message);
    return { success: false, error: error.message, filePath };
  }
}

/**
 * Refactor all identified routes
 */
async function refactorAllRoutes() {
  console.log('🚀 Starting API refactoring process...');
  
  const results = [];
  
  for (const routePath of API_ROUTES_TO_REFACTOR) {
    try {
      // Check if file exists
      try {
        await fs.access(routePath);
      } catch {
        console.log(`⚠️  File not found: ${routePath}`);
        continue;
      }
      
      // Check if already refactored (contains withAuth import)
      const content = await fs.readFile(routePath, 'utf8');
      if (content.includes('withAuth')) {
        console.log(`⏭  Already refactored: ${routePath}`);
        continue;
      }
      
      const result = await refactorRoute(routePath);
      results.push(result);
      
    } catch (error) {
      results.push({ success: false, error: error.message, filePath: routePath });
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Refactoring Summary:');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed routes:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.filePath}: ${r.error}`);
    });
  }
  
  return { total: results.length, successful, failed };
}

/**
 * Generate a report of refactoring status
 */
async function generateReport(results) {
  const reportPath = 'docs/api-refactor-report.md';
  
  const reportContent = `# API Refactor Report

Generated on: ${new Date().toISOString()}

## Summary
- **Total routes processed**: ${results.total}
- **Successfully refactored**: ${results.successful}
- **Failed**: ${results.failed}

## Next Steps
1. Review TODO comments in refactored files
2. Implement business logic for each API
3. Test refactored endpoints
4. Update hooks to use new API client

## Refactored Files
${results.total > 0 ? 
  results.map(r => r.success ? 
    `✅ \`${r.filePath}\` - Successfully refactored` : 
    `❌ \`${r.filePath}\` - Failed: ${r.error}`
  ).join('\n') : 
  'No files processed'
}

## Backup Files
${results.total > 0 ? 
  results.filter(r => r.success).map(r => 
    `📁 \`${r.backupPath}\` - Original file backup`
  ).join('\n') : 
  'No backup files created'
}
`;
  
  await fs.writeFile(reportPath, reportContent);
  console.log(`📄 Report generated: ${reportPath}`);
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'all':
      const results = await refactorAllRoutes();
      await generateReport(results);
      break;
      
    case 'single':
      if (args[1]) {
        const result = await refactorRoute(args[1]);
        if (result.success) {
          console.log(`✅ Successfully refactored: ${result.filePath}`);
        } else {
          console.error(`❌ Failed to refactor: ${result.error}`);
        }
      } else {
        console.error('❌ Please provide a file path');
        console.log('Usage: node scripts/api-refactor-helper.js single <file-path>');
      }
      break;
      
    case 'list':
      console.log('📋 Routes to refactor:');
      API_ROUTES_TO_REFACTOR.forEach(route => {
        console.log(`  - ${route}`);
      });
      break;
      
    default:
      console.log('Usage:');
      console.log('  node scripts/api-refactor-helper.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  all     - Refactor all identified API routes');
      console.log('  single  - Refactor a single route (provide file path)');
      console.log('  list    - List all routes that need refactoring');
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}