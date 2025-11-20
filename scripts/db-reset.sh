#!/bin/bash

# Database Reset Script
# This script resets the database and optionally seeds it with sample data

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
SEED=false
BACKUP=false
FORCE=false
CONFIRM=false

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
        --seed|-s)
            SEED=true
            shift
            ;;
        --backup|-b)
            BACKUP=true
            shift
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        --confirm|-c)
            CONFIRM=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --project-id, -p    Supabase project ID (for remote reset)"
            echo "  --local, -l          Reset local Supabase instance (default)"
            echo "  --seed, -s           Seed database with sample data after reset"
            echo "  --backup, -b         Create backup before reset"
            echo "  --force, -f          Skip confirmation prompts"
            echo "  --confirm, -c        Auto-confirm reset (use with caution)"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Reset local database with confirmation"
            echo "  $0 --local --seed            # Reset and seed local database"
            echo "  $0 --project-id abc123       # Reset remote project database"
            echo "  $0 --force --backup --seed   # Force reset with backup and seeding"
            echo ""
            echo "⚠️  WARNING: This will permanently delete all data in the database!"
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
    
    print_status "Project structure validated"
}

# Create backup if requested
create_backup() {
    if [ "$BACKUP" = true ]; then
        print_status "Creating database backup..."
        
        BACKUP_FILE="backups/database-backup-$(date +%Y%m%d_%H%M%S).sql"
        mkdir -p backups
        
        if [ "$LOCAL" = true ]; then
            # Backup local database
            if supabase db dump --local > "$BACKUP_FILE" 2>/dev/null; then
                print_success "Local database backed up to: $BACKUP_FILE"
            else
                print_warning "Could not create local database backup"
            fi
        else
            # Backup remote database
            if supabase db dump --project-id "$PROJECT_ID" > "$BACKUP_FILE" 2>/dev/null; then
                print_success "Remote database backed up to: $BACKUP_FILE"
            else
                print_warning "Could not create remote database backup"
            fi
        fi
    fi
}

# Confirmation prompt
confirm_reset() {
    if [ "$FORCE" = true ] || [ "$CONFIRM" = true ]; then
        return
    fi
    
    echo ""
    print_warning "⚠️  DANGER ZONE ⚠️"
    echo "This will permanently delete ALL data in the database!"
    echo ""
    
    if [ "$LOCAL" = true ]; then
        echo "Local Supabase instance will be reset."
    else
        echo "Remote Supabase project ($PROJECT_ID) will be reset."
    fi
    
    echo ""
    read -p "Are you absolutely sure you want to continue? (type 'RESET' to confirm): " confirmation
    
    if [ "$confirmation" != "RESET" ]; then
        print_status "Database reset cancelled"
        exit 0
    fi
}

# Reset local database
reset_local_database() {
    print_status "Resetting local Supabase database..."
    
    # Check if Supabase is running locally
    if ! supabase status &> /dev/null; then
        print_status "Starting local Supabase instance..."
        supabase start
    fi
    
    # Reset the database
    if supabase db reset --local; then
        print_success "Local database reset successfully"
    else
        print_error "Failed to reset local database"
        exit 1
    fi
}

# Reset remote database
reset_remote_database() {
    print_status "Resetting remote Supabase database ($PROJECT_ID)..."
    
    # Reset the remote database
    if supabase db reset --project-id "$PROJECT_ID"; then
        print_success "Remote database reset successfully"
    else
        print_error "Failed to reset remote database"
        exit 1
    fi
}

# Seed database with sample data
seed_database() {
    if [ "$SEED" != true ]; then
        return
    fi
    
    print_status "Seeding database with sample data..."
    
    # Check if seed file exists
    if [ -f "supabase/seed.sql" ]; then
        if [ "$LOCAL" = true ]; then
            if supabase db push --local < supabase/seed.sql; then
                print_success "Database seeded successfully"
            else
                print_warning "Could not seed database with supabase/seed.sql"
            fi
        else
            if supabase db push --project-id "$PROJECT_ID" < supabase/seed.sql; then
                print_success "Database seeded successfully"
            else
                print_warning "Could not seed database with supabase/seed.sql"
            fi
        fi
    elif [ -f "scripts/db-seed.js" ]; then
        if node scripts/db-seed.js; then
            print_success "Database seeded successfully"
        else
            print_warning "Could not seed database with scripts/db-seed.js"
        fi
    else
        print_warning "No seed file found. Skipping database seeding."
        print_status "Create one of these files to enable seeding:"
        echo "  - supabase/seed.sql"
        echo "  - scripts/db-seed.js"
    fi
}

# Generate fresh TypeScript types
generate_types() {
    print_status "Generating fresh TypeScript types..."
    
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

# Verify database status
verify_database() {
    print_status "Verifying database status..."
    
    if [ "$LOCAL" = true ]; then
        if supabase status &> /dev/null; then
            print_success "Local Supabase instance is running"
        else
            print_warning "Local Supabase instance is not running"
        fi
    else
        # Check remote project access
        if supabase projects list --project-id "$PROJECT_ID" &> /dev/null; then
            print_success "Remote project is accessible"
        else
            print_warning "Could not access remote project"
        fi
    fi
}

# Main reset process
main() {
    print_status "Starting database reset process..."
    
    # Prerequisites
    check_supabase
    check_project_structure
    
    # Safety confirmation
    confirm_reset
    
    # Create backup if requested
    create_backup
    
    # Reset database based on mode
    if [ "$LOCAL" = true ]; then
        reset_local_database
    else
        reset_remote_database
    fi
    
    # Seed database if requested
    seed_database
    
    # Generate fresh types
    generate_types
    
    # Verify database status
    verify_database
    
    print_success "Database reset completed successfully!"
    echo ""
    print_status "Reset summary:"
    echo "  Target: $([ "$LOCAL" = true ] && echo "Local database" || echo "Remote project: $PROJECT_ID")"
    echo "  Backup created: $([ "$BACKUP" = true ] && echo "Yes" || echo "No")"
    echo "  Data seeded: $([ "$SEED" = true ] && echo "Yes" || echo "No")"
    echo "  Timestamp: $(date)"
    echo ""
    print_status "Next steps:"
    echo "  1. Start development server: npm run dev"
    echo "  2. Verify application is working correctly"
    echo "  3. Check that all features are functioning"
    if [ "$BACKUP" = true ]; then
        echo "  4. Backup files are stored in: backups/"
    fi
}

# Handle script interruption
trap 'print_error "Database reset interrupted."' INT

# Run main function
main "$@"