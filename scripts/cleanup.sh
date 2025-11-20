#!/bin/bash

# Cleanup Script
# This script cleans up the project by removing generated files, cache, and dependencies

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
CLEAN_NODE_MODULES=false
CLEAN_BUILD=false
CLEAN_CACHE=false
CLEAN_LOGS=false
CLEAN_BACKUPS=false
DRY_RUN=false
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --node-modules|-n)
            CLEAN_NODE_MODULES=true
            shift
            ;;
        --build|-b)
            CLEAN_BUILD=true
            shift
            ;;
        --cache|-c)
            CLEAN_CACHE=true
            shift
            ;;
        --logs|-l)
            CLEAN_LOGS=true
            shift
            ;;
        --backups|-k)
            CLEAN_BACKUPS=true
            shift
            ;;
        --all|-a)
            CLEAN_NODE_MODULES=true
            CLEAN_BUILD=true
            CLEAN_CACHE=true
            CLEAN_LOGS=true
            CLEAN_BACKUPS=true
            shift
            ;;
        --dry-run|-d)
            DRY_RUN=true
            shift
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --node-modules, -n    Remove node_modules directory"
            echo "  --build, -b           Remove build directories (.next, dist, build)"
            echo "  --cache, -c           Clear various caches (npm, Next.js, etc.)"
            echo "  --logs, -l            Remove log files"
            echo "  --backups, -k         Remove backup files"
            echo "  --all, -a             Clean everything"
            echo "  --dry-run, -d         Show what would be removed without deleting"
            echo "  --force, -f           Skip confirmation prompts"
            echo "  --help, -h            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --all                    # Clean everything with confirmation"
            echo "  $0 --build --cache          # Clean build and cache only"
            echo "  $0 --node-modules --force    # Remove node_modules without confirmation"
            echo "  $0 --dry-run --all          # Show what would be cleaned"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# If no options specified, show help and exit
if [ "$CLEAN_NODE_MODULES" = false ] && [ "$CLEAN_BUILD" = false ] && [ "$CLEAN_CACHE" = false ] && [ "$CLEAN_LOGS" = false ] && [ "$CLEAN_BACKUPS" = false ]; then
    print_error "No cleanup options specified"
    echo "Use --help for usage information or --all to clean everything"
    exit 1
fi

# Function to calculate directory size
get_dir_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1 || echo "Unknown"
    else
        echo "0"
    fi
}

# Function to remove file/directory with dry run support
remove_item() {
    local item="$1"
    local description="$2"
    
    if [ -e "$item" ]; then
        local size=$(get_dir_size "$item")
        if [ "$DRY_RUN" = true ]; then
            print_status "[DRY RUN] Would remove: $description ($size)"
        else
            print_status "Removing: $description ($size)"
            rm -rf "$item"
            print_success "Removed: $description"
        fi
    else
        print_status "Not found: $description"
    fi
}

# Confirmation prompt
confirm_cleanup() {
    if [ "$FORCE" = true ] || [ "$DRY_RUN" = true ]; then
        return
    fi
    
    echo ""
    print_warning "⚠️  This will permanently delete files and directories!"
    echo ""
    echo "Items to be removed:"
    [ "$CLEAN_NODE_MODULES" = true ] && echo "  - node_modules directory"
    [ "$CLEAN_BUILD" = true ] && echo "  - Build directories (.next, dist, build)"
    [ "$CLEAN_CACHE" = true ] && echo "  - Cache files (npm, Next.js, etc.)"
    [ "$CLEAN_LOGS" = true ] && echo "  - Log files"
    [ "$CLEAN_BACKUPS" = true ] && echo "  - Backup files"
    echo ""
    
    read -p "Are you sure you want to continue? (y/N): " confirmation
    
    if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
        print_status "Cleanup cancelled"
        exit 0
    fi
}

# Clean node_modules
clean_node_modules() {
    if [ "$CLEAN_NODE_MODULES" = true ]; then
        remove_item "node_modules" "node_modules directory"
    fi
}

# Clean build directories
clean_build() {
    if [ "$CLEAN_BUILD" = true ]; then
        remove_item ".next" "Next.js build directory"
        remove_item "dist" "Distribution directory"
        remove_item "build" "Build directory"
        remove_item ".turbo" "Turborepo cache"
        remove_item ".vercel" "Vercel build cache"
        remove_item ".netlify" "Netlify build cache"
    fi
}

# Clean cache files
clean_cache() {
    if [ "$CLEAN_CACHE" = true ]; then
        # npm cache
        remove_item ".npm" "npm cache"
        remove_item "node_modules/.cache" "Node modules cache"
        
        # Next.js cache
        remove_item ".next/cache" "Next.js cache"
        
        # TypeScript cache
        remove_item "*.tsbuildinfo" "TypeScript build cache"
        
        # ESLint cache
        remove_item ".eslintcache" "ESLint cache"
        
        # Stylelint cache
        remove_item ".stylelintcache" "Stylelint cache"
        
        # Test cache
        remove_item ".nyc_output" "NYC test coverage"
        remove_item "coverage" "Test coverage reports"
        
        # OS cache files
        find . -name ".DS_Store" -type f -delete 2>/dev/null || true
        find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
        
        print_status "Cleaned OS cache files"
    fi
}

# Clean log files
clean_logs() {
    if [ "$CLEAN_LOGS" = true ]; then
        # Application logs
        remove_item "logs" "Application logs"
        remove_item "*.log" "Log files"
        remove_item ".next/trace" "Next.js trace logs"
        
        # Server logs
        remove_item ".next/server" "Next.js server logs"
        
        # Error logs
        find . -name "error.log" -type f -delete 2>/dev/null || true
        find . -name "debug.log" -type f -delete 2>/dev/null || true
        find . -name "out.log" -type f -delete 2>/dev/null || true
        
        print_status "Cleaned log files"
    fi
}

# Clean backup files
clean_backups() {
    if [ "$CLEAN_BACKUPS" = true ]; then
        remove_item "backups" "Backup directory"
        remove_item "*.backup" "Backup files"
        remove_item "*.bak" "Backup files"
        remove_item "*.old" "Old files"
        remove_item "*.orig" "Original files"
        
        print_status "Cleaned backup files"
    fi
}

# Show summary
show_summary() {
    echo ""
    print_status "Cleanup Summary:"
    echo "  Node modules: $([ "$CLEAN_NODE_MODULES" = true ] && echo "Yes" || echo "No")"
    echo "  Build files: $([ "$CLEAN_BUILD" = true ] && echo "Yes" || echo "No")"
    echo "  Cache files: $([ "$CLEAN_CACHE" = true ] && echo "Yes" || echo "No")"
    echo "  Log files: $([ "$CLEAN_LOGS" = true ] && echo "Yes" || echo "No")"
    echo "  Backup files: $([ "$CLEAN_BACKUPS" = true ] && echo "Yes" || echo "No")"
    echo "  Mode: $([ "$DRY_RUN" = true ] && echo "Dry run" || echo "Execute")"
    echo "  Timestamp: $(date)"
}

# Show disk space saved
show_disk_space() {
    if [ "$DRY_RUN" = false ]; then
        echo ""
        print_status "Disk space after cleanup:"
        
        # Show current directory size
        if command -v du &> /dev/null; then
            local total_size=$(du -sh . 2>/dev/null | cut -f1 || echo "Unknown")
            echo "  Project size: $total_size"
        fi
        
        # Show free disk space
        if command -v df &> /dev/null; then
            local free_space=$(df -h . 2>/dev/null | tail -1 | awk '{print $4}' || echo "Unknown")
            echo "  Free space: $free_space"
        fi
    fi
}

# Main cleanup process
main() {
    print_status "Starting cleanup process..."
    
    # Show what will be cleaned
    if [ "$DRY_RUN" = true ]; then
        print_status "DRY RUN MODE - No files will be deleted"
    fi
    
    # Get confirmation
    confirm_cleanup
    
    # Perform cleanup
    clean_node_modules
    clean_build
    clean_cache
    clean_logs
    clean_backups
    
    # Show results
    show_summary
    show_disk_space
    
    if [ "$DRY_RUN" = false ]; then
        print_success "Cleanup completed!"
        echo ""
        print_status "Next steps:"
        echo "  1. Run 'npm install' if you removed node_modules"
        echo "  2. Run 'npm run build' to rebuild the application"
        echo "  3. Run 'npm run dev' to start development server"
    else
        print_status "Dry run completed. Use --force to execute cleanup."
    fi
}

# Handle script interruption
trap 'print_error "Cleanup interrupted."' INT

# Run main function
main "$@"