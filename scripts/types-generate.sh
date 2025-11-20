#!/bin/bash

# TypeScript Types Generation Script
# This script generates TypeScript types from Supabase database schema

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
PROJECT_ID=""
LOCAL=false
FORCE=false
BACKUP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project-id|-p)
            PROJECT_ID="$2"
            shift 2
            ;;
        --local|-l)
            LOCAL=true
            shift
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        --backup|-b)
            BACKUP=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --project-id, -p    Supabase project ID (overrides default)"
            echo "  --local, -l          Generate from local Supabase instance"
            echo "  --force, -f          Force overwrite existing types"
            echo "  --backup, -b         Create backup of existing types"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Generate from remote project (default ID)"
            echo "  $0 --local                   # Generate from local instance"
            echo "  $0 --project-id abc123       # Generate from specific project"
            echo "  $0 --force --backup          # Force overwrite with backup"
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
    
    if [ ! -d "src/lib" ]; then
        print_error "src/lib directory not found. Please run this script from the project root."
        exit 1
    fi
    
    print_status "Project structure validated"
}

# Backup existing types if requested
backup_existing_types() {
    if [ "$BACKUP" = true ] && [ -f "src/lib/database.types.ts" ]; then
        BACKUP_FILE="src/lib/database.types.ts.backup.$(date +%Y%m%d_%H%M%S)"
        cp "src/lib/database.types.ts" "$BACKUP_FILE"
        print_success "Backup created: $BACKUP_FILE"
    fi
}

# Check if types file exists and handle force flag
check_existing_types() {
    if [ -f "src/lib/database.types.ts" ] && [ "$FORCE" != true ]; then
        print_warning "database.types.ts already exists"
        echo "Use --force to overwrite or --backup to create a backup first"
        exit 1
    fi
}

# Generate types from remote project
generate_remote_types() {
    local project_id="$1"
    
    if [ -z "$project_id" ]; then
        # Try to get project ID from package.json or environment
        if [ -n "$SUPABASE_PROJECT_ID" ]; then
            project_id="$SUPABASE_PROJECT_ID"
        else
            # Default project ID from the template
            project_id="mjylodxpsuospphixcjm"
            print_warning "Using default project ID: $project_id"
            print_status "Set SUPABASE_PROJECT_ID environment variable or use --project-id to override"
        fi
    fi
    
    print_status "Generating TypeScript types from remote project: $project_id"
    
    if supabase gen types typescript --project-id "$project_id" > src/lib/database.types.ts; then
        print_success "TypeScript types generated successfully from remote project"
    else
        print_error "Failed to generate types from remote project"
        print_status "Please check:"
        echo "  1. Project ID is correct"
        echo "  2. You have access to the project"
        echo "  3. Supabase CLI is authenticated"
        exit 1
    fi
}

# Generate types from local instance
generate_local_types() {
    print_status "Generating TypeScript types from local Supabase instance"
    
    # Check if Supabase is running locally
    if ! supabase status &> /dev/null; then
        print_error "Supabase is not running locally"
        print_status "Start it with: npm run supabase:start"
        exit 1
    fi
    
    if supabase gen types typescript --local > src/lib/database.types.ts; then
        print_success "TypeScript types generated successfully from local instance"
    else
        print_error "Failed to generate types from local instance"
        print_status "Please check:"
        echo "  1. Supabase is running locally"
        echo "  2. Database migrations have been applied"
        exit 1
    fi
}

# Validate generated types
validate_types() {
    if [ ! -f "src/lib/database.types.ts" ]; then
        print_error "Generated types file not found"
        exit 1
    fi
    
    # Check if file is not empty
    if [ ! -s "src/lib/database.types.ts" ]; then
        print_error "Generated types file is empty"
        exit 1
    fi
    
    # Basic TypeScript syntax check
    if command -v tsc &> /dev/null; then
        if tsc --noEmit src/lib/database.types.ts 2>/dev/null; then
            print_success "Generated TypeScript types are valid"
        else
            print_warning "TypeScript compilation check failed, but file was generated"
        fi
    fi
    
    # Show file size
    FILE_SIZE=$(wc -l < src/lib/database.types.ts)
    print_status "Generated $FILE_SIZE lines of TypeScript types"
}

# Update imports if needed
update_imports() {
    # Check if there are any TypeScript files that might need to import the new types
    print_status "TypeScript types are ready to use"
    print_status "Import in your files: import type { Database } from '@/lib/database.types'"
}

# Main generation process
main() {
    print_status "Starting TypeScript types generation..."
    
    # Prerequisites
    check_supabase
    check_project_structure
    
    # Handle existing types
    check_existing_types
    backup_existing_types
    
    # Generate types based on mode
    if [ "$LOCAL" = true ]; then
        generate_local_types
    else
        generate_remote_types "$PROJECT_ID"
    fi
    
    # Validate and finalize
    validate_types
    update_imports
    
    print_success "TypeScript types generation completed!"
    echo ""
    print_status "Next steps:"
    echo "  1. Review the generated types in src/lib/database.types.ts"
    echo "  2. Import types in your components: import type { Database } from '@/lib/database.types'"
    echo "  3. Use the types with Supabase client: supabase.from<Database['public']['Tables']['your_table']>('your_table')"
    echo ""
    if [ "$LOCAL" = true ]; then
        print_status "To generate from remote project next time:"
        echo "  $0  # or npm run db:generate-types-remote"
    else
        print_status "To generate from local instance next time:"
        echo "  $0 --local  # or npm run db:generate"
    fi
}

# Handle script interruption
trap 'print_error "Types generation interrupted."' INT

# Run main function
main "$@"