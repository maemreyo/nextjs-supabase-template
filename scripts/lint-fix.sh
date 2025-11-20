#!/bin/bash

# Lint Fix Script
# This script automatically fixes linting issues in the project

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
FIX_ESLINT=true
FIX_PRETTIER=true
FIX_TYPESCRIPT=false
CHECK_ONLY=false
STAGED_ONLY=false
SPECIFIC_FILES=""
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --eslint|-e)
            FIX_ESLINT=true
            shift
            ;;
        --prettier|-p)
            FIX_PRETTIER=true
            shift
            ;;
        --typescript|-t)
            FIX_TYPESCRIPT=true
            shift
            ;;
        --check-only|-c)
            CHECK_ONLY=true
            shift
            ;;
        --staged-only|-s)
            STAGED_ONLY=true
            shift
            ;;
        --files|-f)
            SPECIFIC_FILES="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --all|-a)
            FIX_ESLINT=true
            FIX_PRETTIER=true
            FIX_TYPESCRIPT=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS] [FILES...]"
            echo ""
            echo "Options:"
            echo "  --eslint, -e          Fix ESLint issues (default)"
            echo "  --prettier, -p        Fix Prettier formatting issues (default)"
            echo "  --typescript, -t       Fix TypeScript issues"
            echo "  --check-only, -c       Check issues without fixing"
            echo "  --staged-only, -s     Only process staged files"
            echo "  --files, -f           Process specific files"
            echo "  --verbose, -v          Show detailed output"
            echo "  --all, -a             Fix all issues (ESLint, Prettier, TypeScript)"
            echo "  --help, -h            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Fix ESLint and Prettier issues"
            echo "  $0 --all                      # Fix all issues"
            echo "  $0 --check-only               # Check issues without fixing"
            echo "  $0 --staged-only              # Fix only staged files"
            echo "  $0 --files src/app/page.tsx    # Fix specific file"
            exit 0
            ;;
        *)
            # If it's not a recognized option, treat it as a file
            if [ -z "$SPECIFIC_FILES" ]; then
                SPECIFIC_FILES="$1"
            else
                SPECIFIC_FILES="$SPECIFIC_FILES $1"
            fi
            shift
            ;;
    esac
done

# Check if we're in the right directory
check_project_structure() {
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    print_status "Project structure validated"
}

# Check if required tools are installed
check_tools() {
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if ESLint is available
    if [ "$FIX_ESLINT" = true ] && ! npm run lint --version &> /dev/null; then
        print_error "ESLint is not available. Check package.json scripts."
        exit 1
    fi
    
    # Check if Prettier is available
    if [ "$FIX_PRETTIER" = true ] && ! npm run format --version &> /dev/null; then
        print_error "Prettier is not available. Check package.json scripts."
        exit 1
    fi
    
    print_success "Required tools are available"
}

# Get staged files if requested
get_staged_files() {
    if [ "$STAGED_ONLY" = true ]; then
        if command -v git &> /dev/null && git rev-parse --git-dir &> /dev/null; then
            STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|md|css|scss)$' || true)
            if [ -z "$STAGED_FILES" ]; then
                print_warning "No staged files to process"
                exit 0
            fi
            print_status "Processing staged files: $(echo $STAGED_FILES | wc -w) files"
        else
            print_error "Git is not initialized or no staged files found"
            exit 1
        fi
    fi
}

# Fix ESLint issues
fix_eslint() {
    if [ "$FIX_ESLINT" != true ]; then
        return
    fi
    
    print_status "Fixing ESLint issues..."
    
    local eslint_files=""
    if [ -n "$SPECIFIC_FILES" ]; then
        eslint_files="$SPECIFIC_FILES"
    elif [ -n "$STAGED_FILES" ]; then
        eslint_files="$STAGED_FILES"
    else
        eslint_files="."
    fi
    
    if [ "$CHECK_ONLY" = true ]; then
        if [ "$VERBOSE" = true ]; then
            npm run lint -- $eslint_files
        else
            npm run lint -- $eslint_files --format=compact
        fi
    else
        if npm run lint:fix -- $eslint_files; then
            print_success "ESLint issues fixed"
        else
            print_warning "Some ESLint issues could not be fixed automatically"
        fi
    fi
}

# Fix Prettier formatting
fix_prettier() {
    if [ "$FIX_PRETTIER" != true ]; then
        return
    fi
    
    print_status "Fixing Prettier formatting..."
    
    local prettier_files=""
    if [ -n "$SPECIFIC_FILES" ]; then
        prettier_files="$SPECIFIC_FILES"
    elif [ -n "$STAGED_FILES" ]; then
        prettier_files="$STAGED_FILES"
    else
        prettier_files="."
    fi
    
    if [ "$CHECK_ONLY" = true ]; then
        if npm run format:check -- $prettier_files; then
            print_success "Prettier formatting is correct"
        else
            print_warning "Prettier formatting issues found"
        fi
    else
        if npm run format -- --write $prettier_files; then
            print_success "Prettier formatting fixed"
        else
            print_warning "Some Prettier formatting issues could not be fixed"
        fi
    fi
}

# Fix TypeScript issues
fix_typescript() {
    if [ "$FIX_TYPESCRIPT" != true ]; then
        return
    fi
    
    print_status "Checking TypeScript issues..."
    
    if [ "$CHECK_ONLY" = true ]; then
        if npm run type-check; then
            print_success "No TypeScript issues found"
        else
            print_warning "TypeScript issues found"
        fi
    else
        # TypeScript issues usually require manual fixes
        print_warning "TypeScript issues usually require manual intervention"
        print_status "Running TypeScript check to identify issues..."
        
        if npm run type-check; then
            print_success "No TypeScript issues found"
        else
            print_error "TypeScript issues found. Please fix manually:"
            echo "  1. Check for missing imports"
            echo "  2. Fix type annotations"
            echo "  3. Resolve undefined variables"
            echo "  4. Check interface implementations"
        fi
    fi
}

# Check for remaining issues
check_remaining_issues() {
    if [ "$CHECK_ONLY" = true ]; then
        return
    fi
    
    print_status "Checking for remaining issues..."
    
    local has_issues=false
    
    # Check ESLint
    if [ "$FIX_ESLINT" = true ]; then
        if ! npm run lint --silent 2>/dev/null; then
            print_warning "Some ESLint issues remain"
            has_issues=true
        fi
    fi
    
    # Check Prettier
    if [ "$FIX_PRETTIER" = true ]; then
        if ! npm run format:check --silent 2>/dev/null; then
            print_warning "Some Prettier formatting issues remain"
            has_issues=true
        fi
    fi
    
    # Check TypeScript
    if [ "$FIX_TYPESCRIPT" = true ]; then
        if ! npm run type-check --silent 2>/dev/null; then
            print_warning "Some TypeScript issues remain"
            has_issues=true
        fi
    fi
    
    if [ "$has_issues" = false ]; then
        print_success "All issues have been fixed!"
    else
        print_warning "Some issues remain. Please fix manually."
    fi
}

# Show summary
show_summary() {
    echo ""
    print_status "Lint Fix Summary:"
    echo "  ESLint: $([ "$FIX_ESLINT" = true ] && echo "Processed" || echo "Skipped")"
    echo "  Prettier: $([ "$FIX_PRETTIER" = true ] && echo "Processed" || echo "Skipped")"
    echo "  TypeScript: $([ "$FIX_TYPESCRIPT" = true ] && echo "Processed" || echo "Skipped")"
    echo "  Mode: $([ "$CHECK_ONLY" = true ] && echo "Check only" || echo "Fix")"
    echo "  Files: $([ -n "$SPECIFIC_FILES" ] && echo "$SPECIFIC_FILES" || [ -n "$STAGED_FILES" ] && echo "Staged files" || echo "All files")"
    echo "  Timestamp: $(date)"
}

# Main lint fix process
main() {
    print_status "Starting lint fix process..."
    
    # Prerequisites
    check_project_structure
    check_tools
    
    # Get files to process
    get_staged_files
    
    # Process based on options
    fix_eslint
    fix_prettier
    fix_typescript
    
    # Check for remaining issues
    check_remaining_issues
    
    # Show summary
    show_summary
    
    if [ "$CHECK_ONLY" = false ]; then
        print_success "Lint fix process completed!"
        echo ""
        print_status "Next steps:"
        echo "  1. Review the changes made"
        echo "  2. Run 'npm run lint' to verify all issues are fixed"
        echo "  3. Commit the changes if everything looks good"
    else
        print_status "Lint check completed. Fix issues with: $0"
    fi
}

# Handle script interruption
trap 'print_error "Lint fix interrupted."' INT

# Run main function
main "$@"