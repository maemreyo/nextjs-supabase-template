#!/bin/bash

# Database Migration Script
# This script handles database migrations for local and remote Supabase instances

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default values
LOCAL=true
PROJECT_ID=""
MIGRATION_FILE=""
DRY_RUN=false
FORCE=false
ROLLBACK=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project-id|-p)
            PROJECT_ID="$2"
            LOCAL=false
            shift 2
            ;;
        --local|-l)
            LOCAL=true
            shift
            ;;
        --migration|-m)
            MIGRATION_FILE="$2"
            shift 2
            ;;
        --dry-run|-d)
            DRY_RUN=true
            shift
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        --rollback|-r)
            ROLLBACK=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --project-id, -p    Supabase project ID (for remote migrations)"
            echo "  --local, -l          Run migrations on local Supabase instance (default)"
            echo "  --migration, -m       Specific migration file to apply"
            echo "  --dry-run, -d         Show what would be done without executing"
            echo "  --force, -f          Skip confirmation prompts"
            echo "  --rollback, -r        Rollback last migration"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Apply all pending migrations locally"
            echo "  $0 --local                    # Run migrations on local instance"
            echo "  $0 --project-id abc123       # Run migrations on remote project"
            echo "  $0 --migration 20231201_init.sql    # Apply specific migration"
            echo "  $0 --rollback                 # Rollback last migration"
            echo "  $0 --dry-run                 # Preview migrations without executing"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if Supabase CLI is installed
check_supabase() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "  npm install -g supabase"
        exit 1
    fi
    
    SUPABASE_VERSION=$(supabase --version)
    print_status "Using Supabase CLI version: $SUPABASE_VERSION"
}

# Check if we're in the right directory
check_project_structure() {
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    if [ ! -d "supabase" ]; then
        print_error "supabase directory not found. Please run this script from the project root."
        exit 1
    fi
    
    if [ ! -d "supabase/migrations" ]; then
        print_error "supabase/migrations directory not found."
        exit 1
    fi
    
    print_status "Project structure validated"
}

# Check migration status
check_migration_status() {
    print_status "Checking migration status..."
    
    if [ "$LOCAL" = true ]; then
        # Check if local Supabase is running
        if ! supabase status &> /dev/null; then
            print_warning "Local Supabase instance is not running"
            print_status "Start it with: npm run supabase:start"
            
            if [ "$FORCE" != true ]; then
                read -p "Do you want to start local Supabase now? (y/N): " start_supabase
                if [ "$start_supabase" = "y" ] || [ "$start_supabase" = "Y" ]; then
                    print_status "Starting local Supabase instance..."
                    supabase start
                    print_success "Local Supabase instance started"
                else
                    print_error "Local Supabase instance is required for migrations"
                    exit 1
                fi
            fi
        fi
        
        # Get migration status
        if supabase migration list --local 2>/dev/null; then
            print_success "Migration status retrieved"
        else
            print_warning "Could not retrieve migration status"
        fi
    else
        # Check remote project access
        if supabase migration list --project-id "$PROJECT_ID" 2>/dev/null; then
            print_success "Migration status retrieved for remote project"
        else
            print_error "Could not access remote project or invalid project ID"
            exit 1
        fi
    fi
}

# List pending migrations
list_pending_migrations() {
    print_status "Listing pending migrations..."
    
    local pending_migrations=()
    
    # Get list of migration files
    for migration_file in supabase/migrations/*.sql; do
        if [ -f "$migration_file" ]; then
            local migration_name=$(basename "$migration_file")
            pending_migrations+=("$migration_name")
        fi
    done
    
    if [ ${#pending_migrations[@]} -eq 0 ]; then
        print_success "No pending migrations found"
        return
    fi
    
    print_status "Pending migrations:"
    for migration in "${pending_migrations[@]}"; do
        echo "  - $migration"
    done
}

# Apply specific migration
apply_specific_migration() {
    if [ -z "$MIGRATION_FILE" ]; then
        return
    fi
    
    local migration_path="supabase/migrations/$MIGRATION_FILE"
    
    if [ ! -f "$migration_path" ]; then
        print_error "Migration file not found: $migration_path"
        exit 1
    fi
    
    print_status "Applying specific migration: $MIGRATION_FILE"
    
    if [ "$DRY_RUN" = true ]; then
        print_status "[DRY RUN] Would apply migration: $MIGRATION_FILE"
        return
    fi
    
    if [ "$LOCAL" = true ]; then
        if supabase db push --local "$migration_path"; then
            print_success "Migration applied successfully: $MIGRATION_FILE"
        else
            print_error "Failed to apply migration: $MIGRATION_FILE"
            exit 1
        fi
    else
        if supabase db push --project-id "$PROJECT_ID" "$migration_path"; then
            print_success "Migration applied successfully: $MIGRATION_FILE"
        else
            print_error "Failed to apply migration: $MIGRATION_FILE"
            exit 1
        fi
    fi
}

# Apply all pending migrations
apply_all_migrations() {
    print_status "Applying all pending migrations..."
    
    if [ "$DRY_RUN" = true ]; then
        print_status "[DRY RUN] Would apply all pending migrations"
        return
    fi
    
    if [ "$LOCAL" = true ]; then
        if supabase db push --local; then
            print_success "All migrations applied successfully to local instance"
        else
            print_error "Failed to apply migrations to local instance"
            exit 1
        fi
    else
        if supabase db push --project-id "$PROJECT_ID"; then
            print_success "All migrations applied successfully to remote project"
        else
            print_error "Failed to apply migrations to remote project"
            exit 1
        fi
    fi
}

# Rollback last migration
rollback_migration() {
    if [ "$ROLLBACK" != true ]; then
        return
    fi
    
    print_warning "⚠️  ROLLBACK OPERATION ⚠️"
    print_warning "This will undo the last migration applied!"
    
    if [ "$FORCE" != true ]; then
        read -p "Are you sure you want to rollback? (type 'ROLLBACK' to confirm): " confirmation
        if [ "$confirmation" != "ROLLBACK" ]; then
            print_status "Rollback cancelled"
            exit 0
        fi
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_status "[DRY RUN] Would rollback last migration"
        return
    fi
    
    # Get the last applied migration
    local last_migration=""
    if [ "$LOCAL" = true ]; then
        last_migration=$(supabase migration list --local | tail -1 | awk '{print $1}' || echo "")
    else
        last_migration=$(supabase migration list --project-id "$PROJECT_ID" | tail -1 | awk '{print $1}' || echo "")
    fi
    
    if [ -z "$last_migration" ]; then
        print_warning "No migrations found to rollback"
        return
    fi
    
    print_status "Rolling back migration: $last_migration"
    
    # Create rollback migration
    local rollback_file="supabase/migrations/rollback_$(date +%Y%m%d_%H%M%S).sql"
    
    # This is a simplified rollback - in practice, you'd want more sophisticated rollback logic
    cat > "$rollback_file" << EOF
-- Rollback migration: $last_migration
-- Generated on: $(date)

-- Add rollback SQL here based on the original migration
-- This is a template - customize based on your specific migration

-- Example:
-- DROP TABLE IF EXISTS table_name;
-- ALTER TABLE table_name DROP COLUMN column_name;

-- Note: Please review and customize this rollback script
-- before applying it to your database.
EOF
    
    print_warning "Rollback template created: $rollback_file"
    print_warning "Please review and customize the rollback SQL before applying"
    print_status "Apply rollback with: $0 --migration $(basename $rollback_file)"
}

# Generate TypeScript types after migration
generate_types() {
    print_status "Generating TypeScript types after migration..."
    
    if [ "$LOCAL" = true ]; then
        if npm run db:generate 2>/dev/null; then
            print_success "TypeScript types generated from local database"
        else
            print_warning "Could not generate TypeScript types from local database"
        fi
    else
        if npm run db:generate-types-remote 2>/dev/null; then
            print_success "TypeScript types generated from remote database"
        else
            print_warning "Could not generate TypeScript types from remote database"
        fi
    fi
}

# Verify migration results
verify_migration() {
    print_status "Verifying migration results..."
    
    # Check if we can connect to the database
    if [ "$LOCAL" = true ]; then
        if supabase status &> /dev/null; then
            print_success "Local database connection verified"
        else
            print_warning "Could not verify local database connection"
        fi
    else
        # For remote, we'll just check if the project is accessible
        if supabase projects list --project-id "$PROJECT_ID" &> /dev/null; then
            print_success "Remote project connection verified"
        else
            print_warning "Could not verify remote project connection"
        fi
    fi
}

# Show migration summary
show_migration_summary() {
    echo ""
    print_status "Migration Summary:"
    echo "  Target: $([ "$LOCAL" = true ] && echo "Local database" || echo "Remote project: $PROJECT_ID")"
    echo "  Mode: $([ "$DRY_RUN" = true ] && echo "Dry run" || echo "Execute")"
    echo "  Migration: $([ -n "$MIGRATION_FILE" ] && echo "$MIGRATION_FILE" || echo "All pending")"
    echo "  Rollback: $([ "$ROLLBACK" = true ] && echo "Yes" || echo "No")"
    echo "  Timestamp: $(date)"
}

# Main migration process
main() {
    print_status "Starting database migration process..."
    
    # Prerequisites
    check_supabase
    check_project_structure
    
    # Check migration status
    check_migration_status
    
    # List pending migrations
    list_pending_migrations
    
    # Handle different migration modes
    if [ "$ROLLBACK" = true ]; then
        rollback_migration
    elif [ -n "$MIGRATION_FILE" ]; then
        apply_specific_migration
    else
        apply_all_migrations
    fi
    
    # Generate updated types
    generate_types
    
    # Verify results
    verify_migration
    
    # Show summary
    show_migration_summary
    
    print_success "Migration process completed!"
    echo ""
    print_status "Next steps:"
    echo "  1. Verify database schema is correct"
    echo "  2. Test application functionality"
    echo "  3. Review generated TypeScript types"
    echo "  4. Commit migration files if everything looks good"
}

# Handle script interruption
trap 'print_error "Migration process interrupted."' INT

# Run main function
main "$@"