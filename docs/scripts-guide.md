# Scripts Guide

This guide provides comprehensive documentation for all the utility scripts included in this Next.js Supabase template.

## Table of Contents

- [Development Scripts](#development-scripts)
  - [dev-setup.sh](#dev-setup-sh) - Development environment setup
  - [db-reset.sh](#db-reset-sh) - Database reset and seeding
  - [types-generate.sh](#types-generate-sh) - TypeScript types generation
  - [deploy.sh](#deploy-sh) - Application deployment
- [Utility Scripts](#utility-scripts)
  - [cleanup.sh](#cleanup-sh) - Project cleanup
  - [lint-fix.sh](#lint-fix-sh) - Linting and formatting
  - [test-coverage.sh](#test-coverage-sh) - Test coverage analysis
  - [bundle-analyze.sh](#bundle-analyze-sh) - Bundle size analysis
- [Database Scripts](#database-scripts)
  - [db-migrate.sh](#db-migrate-sh) - Database migrations
  - [db-seed.js](#db-seed-js) - Database seeding
  - [db-backup.js](#db-backup-js) - Database backup
  - [db-restore.js](#db-restore-js) - Database restoration
- [AI Scripts](#ai-scripts)
  - [ai-test-providers.sh](#ai-test-providers-sh) - AI providers testing
  - [ai-usage-report.sh](#ai-usage-report-sh) - AI usage reporting
  - [ai-cache-clear.sh](#ai-cache-clear-sh) - AI cache management
- [GitHub Actions](#github-actions)
  - [CI Workflow](#ci-workflow) - Continuous integration
  - [Deploy Workflow](#deploy-workflow) - Deployment automation
  - [Test Workflow](#test-workflow) - Comprehensive testing

## Development Scripts

### dev-setup.sh

**Purpose**: Sets up the complete development environment for the project.

**Usage**:
```bash
./scripts/dev-setup.sh
```

**Features**:
- Checks and installs required dependencies (Node.js, npm, Supabase CLI)
- Creates environment configuration files
- Generates TypeScript types from database
- Runs initial linting and type checking
- Provides guided setup process

**Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- Other AI provider API keys as needed

**Example**:
```bash
# Basic setup
./scripts/dev-setup.sh

# Setup with specific project ID
SUPABASE_PROJECT_ID=your_project_id ./scripts/dev-setup.sh

# Setup with verbose output
VERBOSE=true ./scripts/dev-setup.sh
```

### db-reset.sh

**Purpose**: Resets the database and optionally seeds it with sample data.

**Usage**:
```bash
# Reset local database
./scripts/db-reset.sh

# Reset remote database
./scripts/db-reset.sh --project-id your_project_id

# Reset with seeding
./scripts/db-reset.sh --seed

# Force reset without confirmation
./scripts/db-reset.sh --force

# Create backup before reset
./scripts/db-reset.sh --backup
```

**Options**:
- `--project-id, -p`: Supabase project ID (for remote reset)
- `--local, -l`: Reset local Supabase instance (default)
- `--seed, -s`: Seed database with sample data after reset
- `--backup, -b`: Create backup before reset
- `--force, -f`: Skip confirmation prompts
- `--confirm, -c`: Auto-confirm reset (use with caution)

**Safety Features**:
- Requires explicit confirmation (`RESET` keyword)
- Optional backup creation
- Dry run mode support

### types-generate.sh

**Purpose**: Generates TypeScript types from Supabase database schema.

**Usage**:
```bash
# Generate from remote project
./scripts/types-generate.sh

# Generate from local instance
./scripts/types-generate.sh --local

# Generate with backup
./scripts/types-generate.sh --backup

# Force overwrite
./scripts/types-generate.sh --force

# Generate for specific project
./scripts/types-generate.sh --project-id your_project_id
```

**Options**:
- `--project-id, -p`: Supabase project ID
- `--local, -l`: Generate from local Supabase instance
- `--backup, -b`: Create backup of existing types
- `--force, -f`: Force overwrite existing types
- `--help, -h`: Show help message

**Integration**:
- Automatically updates `src/lib/database.types.ts`
- Validates generated types
- Works with both local and remote Supabase instances

### deploy.sh

**Purpose**: Handles deployment to various platforms with comprehensive pre-deployment checks.

**Usage**:
```bash
# Deploy to Vercel
./scripts/deploy.sh --platform vercel

# Deploy to Netlify staging
./scripts/deploy.sh --platform netlify --environment staging

# Deploy to AWS production
./scripts/deploy.sh --platform aws --environment production

# Build only (no deployment)
./scripts/deploy.sh --build-only

# Deploy with custom options
./scripts/deploy.sh --platform vercel --environment production --skip-tests --verbose
```

**Supported Platforms**:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Custom (via `scripts/custom-deploy.sh`)

**Features**:
- Pre-deployment validation (tests, linting, security audit)
- Bundle analysis
- Environment-specific configurations
- Rollback capabilities
- Deployment notifications

## Utility Scripts

### cleanup.sh

**Purpose**: Cleans up project by removing generated files, cache, and dependencies.

**Usage**:
```bash
# Clean everything
./scripts/cleanup.sh --all

# Clean specific items
./scripts/cleanup.sh --node-modules --build --cache

# Dry run (preview what would be deleted)
./scripts/cleanup.sh --dry-run --all

# Force cleanup without confirmation
./scripts/cleanup.sh --force --all
```

**Options**:
- `--node-modules, -n`: Remove node_modules directory
- `--build, -b`: Remove build directories (.next, dist, build)
- `--cache, -c`: Clear various caches
- `--logs, -l`: Remove log files
- `--backups, -k`: Remove backup files
- `--all, -a`: Clean everything
- `--dry-run, -d`: Show what would be removed
- `--force, -f`: Skip confirmation prompts

**Cleanup Targets**:
- Node modules and package cache
- Build outputs (.next, dist, build)
- Application caches (npm, Next.js, ESLint)
- Log files and error reports
- Backup files and old versions
- OS-specific cache files (.DS_Store, Thumbs.db)

### lint-fix.sh

**Purpose**: Automatically fixes linting and formatting issues across the codebase.

**Usage**:
```bash
# Fix all issues
./scripts/lint-fix.sh

# Fix specific issues
./scripts/lint-fix.sh --eslint --prettier

# Fix only staged files
./scripts/lint-fix.sh --staged-only

# Check only (no fixes)
./scripts/lint-fix.sh --check-only

# Fix with verbose output
./scripts/lint-fix.sh --verbose
```

**Options**:
- `--eslint, -e`: Fix ESLint issues (default)
- `--prettier, -p`: Fix Prettier formatting issues (default)
- `--typescript, -t`: Fix TypeScript issues
- `--check-only, -c`: Check issues without fixing
- `--staged-only, -s`: Process only staged files
- `--files, -f`: Process specific files
- `--verbose, -v`: Show detailed output
- `--all, -a`: Fix all issue types
- `--help, -h`: Show help message

**Integration**:
- Works with ESLint, Prettier, and TypeScript
- Supports staged files processing
- Generates detailed reports
- Configurable rules and thresholds

### test-coverage.sh

**Purpose**: Runs tests with comprehensive coverage analysis and reporting.

**Usage**:
```bash
# Run all tests with coverage
./scripts/test-coverage.sh

# Run specific test types
./scripts/test-coverage.sh --unit-only --threshold 90

# Run with custom output
./scripts/test-coverage.sh --output-format json --output-file coverage.json

# Include E2E tests
./scripts/test-coverage.sh --all-tests

# Run with browser testing
./scripts/test-coverage.sh --e2e-only --browser chromium
```

**Options**:
- `--threshold, -t`: Coverage threshold percentage (default: 80)
- `--watch, -w`: Run tests in watch mode
- `--open, -o`: Open coverage report in browser
- `--upload, -u`: Upload coverage to service
- `--output-format, -f`: Output format (table, json, csv, html)
- `--output-file, -o`: Save report to file
- `--unit-only`: Run only unit tests
- `--integration-only`: Run only integration tests
- `--e2e-only`: Run only E2E tests
- `--all-tests`: Run all test types
- `--browser`: Browser for E2E tests
- `--help, -h`: Show help message

**Features**:
- Multiple test type support (unit, integration, E2E)
- Coverage threshold enforcement
- Multiple output formats
- Browser-based E2E testing
- Integration with coverage services
- Performance and accessibility testing

### bundle-analyze.sh

**Purpose**: Analyzes bundle size and provides optimization suggestions.

**Usage**:
```bash
# Analyze current bundle
./scripts/bundle-analyze.sh

# Compare with main branch
./scripts/bundle-analyze.sh --compare

# Analyze with custom threshold
./scripts/bundle-analyze.sh --threshold 2

# Generate HTML report
./scripts/bundle-analyze.sh --output-format html --open
```

**Options**:
- `--analyze, -a`: Analyze bundle size (sets ANALYZE=true)
- `--compare, -c`: Compare with base branch
- `--base-branch, -b`: Base branch for comparison (default: main)
- `--threshold, -t`: Size threshold in MB (default: 5)
- `--output, -f`: Output directory for analysis
- `--open, -o`: Open analysis report in browser
- `--output-format, -f`: Output format (table, json, csv)
- `--help, -h`: Show help message

**Features**:
- Integration with Next.js bundle analyzer
- Branch comparison capabilities
- Size threshold enforcement
- Multiple output formats
- Optimization suggestions
- Performance metrics tracking

## Database Scripts

### db-migrate.sh

**Purpose**: Handles database migrations for local and remote Supabase instances.

**Usage**:
```bash
# Apply all pending migrations locally
./scripts/db-migrate.sh

# Apply specific migration
./scripts/db-migrate.sh --migration 20231201_init.sql

# Migrate remote project
./scripts/db-migrate.sh --project-id your_project_id

# Rollback last migration
./scripts/db-migrate.sh --rollback

# Dry run mode
./scripts/db-migrate.sh --dry-run
```

**Options**:
- `--project-id, -p`: Supabase project ID (for remote migrations)
- `--local, -l`: Run migrations on local Supabase instance (default)
- `--migration, -m`: Specific migration file to apply
- `--dry-run, -d`: Show what would be executed
- `--force, -f`: Skip confirmation prompts
- `--rollback, -r`: Rollback last migration
- `--help, -h`: Show help message

**Features**:
- Local and remote migration support
- Migration status checking
- Rollback capabilities
- Dry run mode
- Migration history tracking
- SQL syntax validation

### db-seed.js

**Purpose**: Seeds database with sample data for development and testing.

**Usage**:
```bash
# Seed with default data
node scripts/db-seed.js

# Seed with custom data file
node scripts/db-seed.js --data-path ./custom-seed.json

# Reset and seed
node scripts/db-seed.js --reset

# Generate seed data template
node scripts/db-seed.js --template
```

**Options**:
- `--data-path`: Path to custom seed data file
- `--template`: Generate seed data template
- `--reset`: Reset database before seeding
- `--help`: Show help message

**Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `SEED_DATA_PATH`: Path to seed data file
- `RESET_BEFORE_SEED`: Reset database before seeding

**Features**:
- JSON and SQL seed data support
- Template generation
- Multiple table seeding
- Data validation
- Progress tracking

### db-backup.js

**Purpose**: Creates comprehensive database backups in multiple formats.

**Usage**:
```bash
# Backup with default settings
node scripts/db-backup.js

# Backup specific format
node scripts/db-backup.js --format json

# Backup remote database
node scripts/db-backup.js --remote

# Backup with compression
node scripts/db-backup.js --compression

# Backup specific tables
node scripts/db-backup.js --tables users,profiles

# Custom backup directory
node scripts/db-backup.js --backup-dir ./backups
```

**Options**:
- `--format`: Backup format (sql, json, csv)
- `--remote`: Backup remote database
- `--compression`: Enable/disable compression
- `--schema-only`: Backup schema only
- `--tables`: Comma-separated list of tables
- `--exclude`: Tables to exclude from backup
- `--backup-dir`: Custom backup directory
- `--max-backups`: Maximum backups to keep
- `--help`: Show help message

**Features**:
- Multiple format support (SQL, JSON, CSV)
- Local and remote backup
- Compression support
- Selective table backup
- Backup rotation
- Metadata inclusion

### db-restore.js

**Purpose**: Restores database from backup files with comprehensive validation.

**Usage**:
```bash
# Interactive restore
node scripts/db-restore.js

# Restore specific file
node scripts/db-restore.js --file backup.sql

# Restore to remote database
node scripts/db-restore.js --remote

# Dry run restore
node scripts/db-restore.js --dry-run
```

**Options**:
- `--file`: Specific backup file to restore
- `--backup-dir`: Backup directory path
- `--remote`: Restore to remote database
- `--dry-run`: Preview restore without executing
- `--force`: Skip confirmation prompts
- `--help`: Show help message

**Safety Features**:
- Interactive backup selection
- Confirmation prompts
- Dry run mode
- Multiple format support
- Validation and error handling

## AI Scripts

### ai-test-providers.sh

**Purpose**: Tests connectivity and functionality of various AI providers.

**Usage**:
```bash
# Test all providers
./scripts/ai-test-providers.sh --all

# Test specific provider
./scripts/ai-test-providers.sh --provider openai --test-type generation

# Test with verbose output
./scripts/ai-test-providers.sh --provider anthropic --verbose

# Test specific model
./scripts/ai-test-providers.sh --provider openai --model gpt-4 --test-type connectivity

# Output in JSON format
./scripts/ai-test-providers.sh --all --output-format json
```

**Options**:
- `--provider, -p`: AI provider to test
- `--test-type, -t`: Test type (connectivity, generation, analysis)
- `--api-key, -k`: API key for the provider
- `--model, -m`: Specific model to test
- `--timeout, -o`: Request timeout in seconds
- `--verbose, -v`: Show detailed output
- `--output, -f`: Output format (table, json, csv)
- `--all, -a`: Test all configured providers
- `--help, -h`: Show help message

**Supported Providers**:
- OpenAI (GPT-3.5, GPT-4, etc.)
- Anthropic (Claude family)
- Google Gemini
- Groq
- Cohere
- OpenRouter
- Zhipu AI
- Together AI

### ai-usage-report.sh

**Purpose**: Generates comprehensive AI usage reports from various data sources.

**Usage**:
```bash
# Generate summary report
./scripts/ai-usage-report.sh --report-type summary

# Generate cost analysis
./scripts/ai-usage-report.sh --report-type cost --output-format json

# Generate report for specific time range
./scripts/ai-usage-report.sh --from-date 2023-12-01 --to-date 2023-12-31

# Generate HTML report
./scripts/ai-usage-report.sh --report-type detailed --output-format html --output-file report.html
```

**Options**:
- `--report-type, -r`: Report type (summary, detailed, cost, performance, errors)
- `--time-range, -t`: Time range (1d, 7d, 30d, custom)
- `--output-format, -f`: Output format (table, json, csv, html)
- `--output-file, -o`: Save report to file
- `--from-date, -s`: Start date (YYYY-MM-DD)
- `--to-date, -u`: End date (YYYY-MM-DD)
- `--provider, -p`: Filter by AI provider
- `--model, -m`: Filter by model
- `--help, -h`: Show help message

**Report Types**:
- **Summary**: Overall usage metrics and key statistics
- **Detailed**: Request-by-request breakdown
- **Cost**: Cost analysis and breakdown by provider/model
- **Performance**: Response times and throughput metrics
- **Errors**: Error analysis and failure rates

### ai-cache-clear.sh

**Purpose**: Clears AI-related caches and temporary files across the system.

**Usage**:
```bash
# Clear all AI caches
./scripts/ai-cache-clear.sh --all

# Clear specific cache type
./scripts/ai-cache-clear.sh --type responses --provider openai

# Clear specific directory
./scripts/ai-cache-clear.sh --path /tmp/ai-cache

# Force clear without confirmation
./scripts/ai-cache-clear.sh --force --all

# Dry run preview
./scripts/ai-cache-clear.sh --dry-run --type all
```

**Options**:
- `--type, -t`: Cache type (all, api, responses, embeddings, models, temp)
- `--provider, -p`: Clear cache for specific provider only
- `--path, -a`: Clear specific cache path
- `--dry-run, -d`: Show what would be cleared
- `--force, -f`: Skip confirmation prompts
- `--verbose, -v`: Show detailed output
- `--help, -h`: Show help message

**Cache Types**:
- API response caches
- AI response caches
- Embedding caches
- Model caches
- Temporary files
- Browser caches
- Memory caches

## GitHub Actions

### CI Workflow (.github/workflows/ci.yml)

**Purpose**: Comprehensive continuous integration workflow with testing, security scanning, and build validation.

**Triggers**:
- Push to main/develop branches
- Pull requests to main/develop
- Daily schedule (2 AM UTC)
- Manual workflow dispatch

**Jobs**:
1. **Lint & Type Check**: Validates code quality and TypeScript types
2. **Test Matrix**: Runs tests across multiple Node.js versions
3. **Build**: Creates production build with bundle analysis
4. **Security Scan**: Runs security audit and vulnerability scanning
5. **Database Migration Test**: Tests database migration scripts
6. **Performance Test**: Runs Lighthouse performance audits
7. **Accessibility Test**: Runs accessibility testing with axe
8. **Test Summary**: Consolidates all test results and coverage

**Features**:
- Multi-Node.js version testing (16, 18, 20)
- Comprehensive test coverage reporting
- Security vulnerability scanning
- Performance and accessibility testing
- Bundle size analysis
- Artifact management and retention
- Status reporting and summaries

### Deploy Workflow (.github/workflows/deploy.yml)

**Purpose**: Automated deployment with pre-deployment checks and multi-platform support.

**Triggers**:
- Push to main/develop (auto-deploy)
- Pull request merge (auto-deploy)
- Manual workflow dispatch
- Path changes (config, source files)

**Jobs**:
1. **Pre-deploy Checks**: Validates deployment readiness
2. **Security & Dependency Check**: Security audit and dependency validation
3. **Build Matrix**: Builds across multiple Node.js versions
4. **Platform Deployments**: Vercel, Netlify, AWS S3
5. **Post-deploy Tests**: Smoke tests and E2E validation
6. **Notification**: Deployment status notifications

**Features**:
- Environment-specific deployments
- Security validation
- Build artifact management
- Rollback capabilities
- Post-deployment validation
- Comprehensive logging and reporting

### Test Workflow (.github/workflows/test.yml)

**Purpose**: Comprehensive testing workflow including unit, integration, E2E, and specialized testing.

**Triggers**:
- Push to main/develop (source changes)
- Pull requests (source changes)
- Daily schedule (2 AM UTC)
- Manual workflow dispatch with parameters

**Jobs**:
1. **Unit Tests**: Matrix testing across Node.js versions
2. **Integration Tests**: With service dependencies
3. **E2E Tests**: Multi-browser testing (Chromium, Firefox, WebKit)
4. **Performance Tests**: Lighthouse audits
5. **Accessibility Tests**: axe accessibility testing
6. **Visual Regression**: Backstopjs visual comparison
7. **Security Tests**: OWASP ZAP security scanning
8. **Test Summary**: Consolidated reporting and coverage merging

**Features**:
- Comprehensive test matrix
- Multiple browser support
- Performance and accessibility testing
- Visual regression detection
- Security vulnerability scanning
- Coverage collection and merging
- Detailed test reporting

## Best Practices

### Script Usage

1. **Environment Setup**:
   ```bash
   # Always run from project root
   ./scripts/script-name.sh
   ```

2. **Configuration**:
   ```bash
   # Use environment variables for sensitive data
   export API_KEY="your_key"
   ./scripts/script-name.sh
   ```

3. **Error Handling**:
   ```bash
   # Check exit codes
   ./scripts/script-name.sh
   if [ $? -eq 0 ]; then
       echo "Success!"
   fi
   ```

### Security

1. **API Keys**:
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly
   - Use service-specific keys when possible

2. **Database Operations**:
   - Always backup before major operations
   - Test migrations on staging first
   - Use transactions for data consistency
   - Validate backups regularly

3. **Deployment Safety**:
   - Use dry-run mode for testing
   - Implement rollback procedures
   - Monitor deployments closely
   - Use staging environments for validation

### Troubleshooting

#### Common Issues

1. **Permission Denied**:
   ```bash
   chmod +x scripts/script-name.sh
   ./scripts/script-name.sh
   ```

2. **Missing Dependencies**:
   ```bash
   # Run dev setup first
   ./scripts/dev-setup.sh
   ```

3. **Environment Variables**:
   ```bash
   # Check available variables
   ./scripts/script-name.sh --help
   ```

4. **Database Connection**:
   ```bash
   # Check Supabase status
   supabase status
   ```

#### Getting Help

All scripts support the `--help` or `-h` flag for detailed usage information:

```bash
./scripts/script-name.sh --help
```

## Integration Examples

### Complete Development Workflow

```bash
# 1. Setup environment
./scripts/dev-setup.sh

# 2. Start local services
npm run supabase:start

# 3. Run tests with coverage
./scripts/test-coverage.sh --threshold 85

# 4. Analyze bundle size
./scripts/bundle-analyze.sh --threshold 3

# 5. Fix any issues
./scripts/lint-fix.sh

# 6. Deploy to staging
./scripts/deploy.sh --platform vercel --environment staging
```

### Database Migration Workflow

```bash
# 1. Backup current database
node scripts/db-backup.js

# 2. Test migrations
./scripts/db-migrate.sh --dry-run

# 3. Apply migrations
./scripts/db-migrate.sh

# 4. Seed with test data
node scripts/db-seed.js

# 5. Generate updated types
./scripts/types-generate.sh

# 6. Verify data integrity
node scripts/db-seed.js --validate
```

### AI Provider Testing

```bash
# 1. Test all providers
./scripts/ai-test-providers.sh --all --test-type connectivity

# 2. Test specific functionality
./scripts/ai-test-providers.sh --provider openai --test-type generation --model gpt-4

# 3. Generate usage report
./scripts/ai-usage-report.sh --report-type cost --time-range 7d

# 4. Clear caches if needed
./scripts/ai-cache-clear.sh --type responses
```

## Contributing

When adding new scripts or modifying existing ones:

1. **Follow the established patterns** for consistency
2. **Add comprehensive help documentation** with examples
3. **Include error handling** with meaningful messages
4. **Add logging** for debugging and monitoring
5. **Test thoroughly** before committing changes
6. **Update this documentation** with new script information

## Support

For issues or questions about scripts:

1. Check the script's help documentation first
2. Review this guide for troubleshooting steps
3. Check GitHub Issues for known problems
4. Create new issues with detailed error information and environment details