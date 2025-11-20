#!/bin/bash

# AI Cache Clear Script
# This script clears various AI-related caches and temporary files

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_cache() {
    echo -e "${CYAN}[CACHE]${NC} $1"
}

# Default values
CACHE_TYPE="all"
PROVIDER=""
DRY_RUN=false
FORCE=false
VERBOSE=false
SPECIFIC_PATH=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --type|-t)
            CACHE_TYPE="$2"
            shift 2
            ;;
        --provider|-p)
            PROVIDER="$2"
            shift 2
            ;;
        --path|-a)
            SPECIFIC_PATH="$2"
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
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --type, -t           Cache type to clear: all, api, responses, embeddings, models, temp"
            echo "  --provider, -p         Clear cache for specific provider only"
            echo "  --path, -a            Clear specific cache path"
            echo "  --dry-run, -d         Show what would be cleared without deleting"
            echo "  --force, -f           Skip confirmation prompts"
            echo "  --verbose, -v          Show detailed output"
            echo "  --help, -h            Show this help message"
            echo ""
            echo "Cache Types:"
            echo "  all          Clear all AI-related caches"
            echo "  api          Clear API response caches"
            echo "  responses    Clear cached AI responses"
            echo "  embeddings   Clear embedding caches"
            echo "  models       Clear model caches"
            echo "  temp         Clear temporary files"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Clear all caches with confirmation"
            echo "  $0 --type responses --provider openai   # Clear OpenAI response cache"
            echo "  $0 --type temp --force                  # Clear temp files without confirmation"
            echo "  $0 --dry-run --type all                 # Preview what would be cleared"
            echo "  $0 --path /tmp/ai-cache               # Clear specific directory"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
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

# Get cache size
get_cache_size() {
    local path="$1"
    
    if [ -d "$path" ]; then
        # Calculate directory size
        if command -v du &> /dev/null; then
            du -sh "$path" 2>/dev/null | cut -f1 || echo "Unknown"
        else
            echo "Unknown"
        fi
    elif [ -f "$path" ]; then
        # Get file size
        if command -v stat &> /dev/null; then
            local size=$(stat -f%z "$path" 2>/dev/null || stat -c%s "$path" 2>/dev/null || echo "0")
            echo "$(($size / 1024 / 1024))" 2>/dev/null || echo "0"
        else
            echo "Unknown"
        fi
    else
        echo "0"
    fi
}

# Clear specific cache directory
clear_cache_directory() {
    local cache_path="$1"
    local description="$2"
    
    if [ ! -e "$cache_path" ]; then
        print_cache "Cache not found: $description ($cache_path)"
        return 0
    fi
    
    local size=$(get_cache_size "$cache_path")
    
    if [ "$DRY_RUN" = true ]; then
        print_cache "[DRY RUN] Would clear: $description ($cache_path) - ${size}MB"
        return 0
    fi
    
    print_cache "Clearing: $description ($cache_path) - ${size}MB"
    
    if rm -rf "$cache_path" 2>/dev/null; then
        print_success "Cleared: $description"
        return 0
    else
        print_error "Failed to clear: $description"
        return 1
    fi
}

# Clear API response caches
clear_api_caches() {
    print_status "Clearing API response caches..."
    
    local cleared=0
    local failed=0
    
    # Common cache directories
    local cache_dirs=(
        ".next/cache/api"
        ".next/cache/ai"
        "node_modules/.cache"
        ".ai-cache"
        "cache/ai-responses"
        "tmp/ai-cache"
        "~/.cache/ai-responses"
        "~/.cache/openai"
        "~/.cache/anthropic"
        "~/.cache/gemini"
    )
    
    for cache_dir in "${cache_dirs[@]}"; do
        # Expand ~ to home directory
        cache_dir="${cache_dir/#\~/$HOME}"
        
        # Apply provider filter if specified
        if [ -n "$PROVIDER" ]; then
            if [[ ! "$cache_dir" == *"$PROVIDER"* ]]; then
                continue
            fi
        fi
        
        if clear_cache_directory "$cache_dir" "API cache: $cache_dir"; then
            ((cleared++))
        else
            ((failed++))
        fi
    done
    
    print_cache "API caches cleared: $cleared successful, $failed failed"
    return $failed
}

# Clear response caches
clear_response_caches() {
    print_status "Clearing AI response caches..."
    
    local cleared=0
    local failed=0
    
    # Response cache locations
    local response_dirs=(
        ".next/cache/responses"
        "cache/ai-responses"
        "tmp/ai-responses"
        ".ai-cache/responses"
        "public/cache/ai"
        "storage/ai-cache"
    )
    
    for response_dir in "${response_dirs[@]}"; do
        response_dir="${response_dir/#\~/$HOME}"
        
        # Apply provider filter if specified
        if [ -n "$PROVIDER" ]; then
            if [[ ! "$response_dir" == *"$PROVIDER"* ]]; then
                continue
            fi
        fi
        
        if clear_cache_directory "$response_dir" "Response cache: $response_dir"; then
            ((cleared++))
        else
            ((failed++))
        fi
    done
    
    print_cache "Response caches cleared: $cleared successful, $failed failed"
    return $failed
}

# Clear embedding caches
clear_embedding_caches() {
    print_status "Clearing embedding caches..."
    
    local cleared=0
    local failed=0
    
    # Embedding cache locations
    local embedding_dirs=(
        ".next/cache/embeddings"
        "cache/embeddings"
        "tmp/embeddings"
        ".ai-cache/embeddings"
        "storage/embeddings"
        "vector-cache"
    )
    
    for embedding_dir in "${embedding_dirs[@]}"; do
        embedding_dir="${embedding_dir/#\~/$HOME}"
        
        if clear_cache_directory "$embedding_dir" "Embedding cache: $embedding_dir"; then
            ((cleared++))
        else
            ((failed++))
        fi
    done
    
    print_cache "Embedding caches cleared: $cleared successful, $failed failed"
    return $failed
}

# Clear model caches
clear_model_caches() {
    print_status "Clearing model caches..."
    
    local cleared=0
    local failed=0
    
    # Model cache locations
    local model_dirs=(
        ".next/cache/models"
        "cache/models"
        "tmp/models"
        ".ai-cache/models"
        "~/.cache/huggingface"
        "~/.cache/transformers"
        "~/.cache/torch"
    )
    
    for model_dir in "${model_dirs[@]}"; do
        model_dir="${model_dir/#\~/$HOME}"
        
        if clear_cache_directory "$model_dir" "Model cache: $model_dir"; then
            ((cleared++))
        else
            ((failed++))
        fi
    done
    
    print_cache "Model caches cleared: $cleared successful, $failed failed"
    return $failed
}

# Clear temporary files
clear_temp_files() {
    print_status "Clearing temporary files..."
    
    local cleared=0
    local failed=0
    
    # Temporary file patterns
    local temp_patterns=(
        "tmp/ai-*"
        "temp/ai-*"
        ".ai-temp-*"
        "*.ai-temp"
        "logs/ai-*.log"
        ".next/ai-temp-*"
    )
    
    for pattern in "${temp_patterns[@]}"; do
        pattern="${pattern/#\~/$HOME}"
        
        # Find and remove matching files
        local files=$(find . -name "$pattern" -type f 2>/dev/null || true)
        local dirs=$(find . -name "$pattern" -type d 2>/dev/null || true)
        
        for file in $files; do
            if [ "$DRY_RUN" = true ]; then
                print_cache "[DRY RUN] Would remove temp file: $file"
            else
                if rm -f "$file" 2>/dev/null; then
                    ((cleared++))
                    if [ "$VERBOSE" = true ]; then
                        print_cache "Removed temp file: $file"
                    fi
                else
                    ((failed++))
                fi
            fi
        done
        
        for dir in $dirs; do
            if clear_cache_directory "$dir" "Temp directory: $dir"; then
                ((cleared++))
            else
                ((failed++))
            fi
        done
    done
    
    print_cache "Temporary files cleared: $cleared successful, $failed failed"
    return $failed
}

# Clear specific path
clear_specific_path() {
    if [ -z "$SPECIFIC_PATH" ]; then
        return 0
    fi
    
    print_status "Clearing specific path: $SPECIFIC_PATH"
    
    local path="${SPECIFIC_PATH/#\~/$HOME}"
    
    if clear_cache_directory "$path" "Specific path: $SPECIFIC_PATH"; then
        return 0
    else
        return 1
    fi
}

# Clear browser/HTTP caches
clear_browser_caches() {
    print_status "Clearing browser/HTTP caches..."
    
    local cleared=0
    local failed=0
    
    # Browser cache directories (simplified)
    local browser_dirs=(
        ".next/cache/browser"
        "public/_next/static/chunks"
        ".vercel/cache"
        ".netlify/cache"
    )
    
    for browser_dir in "${browser_dirs[@]}"; do
        browser_dir="${browser_dir/#\~/$HOME}"
        
        if clear_cache_directory "$browser_dir" "Browser cache: $browser_dir"; then
            ((cleared++))
        else
            ((failed++))
        fi
    done
    
    print_cache "Browser caches cleared: $cleared successful, $failed failed"
    return $failed
}

# Clear Redis cache (if applicable)
clear_redis_cache() {
    print_status "Checking Redis cache..."
    
    # Check if Redis is available
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            print_cache "Redis is running"
            
            if [ "$DRY_RUN" = true ]; then
                print_cache "[DRY RUN] Would clear Redis cache"
            else
                # Clear AI-related keys
                local keys=$(redis-cli --scan --pattern "ai:*" 2>/dev/null || echo "")
                if [ -n "$keys" ]; then
                    local key_count=$(echo "$keys" | grep -c "ai:" || echo "0")
                    print_cache "Found $key_count AI-related keys in Redis"
                    
                    if redis-cli --scan --pattern "ai:*" | xargs redis-cli del 2>/dev/null; then
                        print_success "Redis AI cache cleared"
                    else
                        print_error "Failed to clear Redis AI cache"
                    fi
                else
                    print_cache "No AI-related keys found in Redis"
                fi
            fi
        else
            print_cache "Redis is not running"
        fi
    else
        print_cache "Redis CLI not available"
    fi
}

# Clear memory caches (Node.js process)
clear_memory_caches() {
    print_status "Clearing memory caches..."
    
    # This is a simplified approach
    # In practice, you might want to restart services or use specific APIs
    
    if [ "$DRY_RUN" = true ]; then
        print_cache "[DRY RUN] Would clear memory caches"
        return 0
    fi
    
    # Try to clear Next.js cache
    if [ -d ".next" ]; then
        print_cache "Clearing Next.js build cache..."
        rm -rf .next/cache 2>/dev/null || true
        print_success "Next.js cache cleared"
    fi
    
    # Clear any Node.js cache
    local node_cache_dirs=(
        "$HOME/.npm"
        "$HOME/.node-gyp"
        "$HOME/.cache/yarn"
        "$HOME/.cache/npm"
    )
    
    for cache_dir in "${node_cache_dirs[@]}"; do
        if [ -d "$cache_dir" ]; then
            print_cache "Clearing Node.js cache: $cache_dir"
            rm -rf "${cache_dir}/_cacache" 2>/dev/null || true
            rm -rf "${cache_dir}/_logs" 2>/dev/null || true
        fi
    done
}

# Confirmation prompt
confirm_clear() {
    if [ "$FORCE" = true ] || [ "$DRY_RUN" = true ]; then
        return
    fi
    
    echo ""
    print_warning "⚠️  CACHE CLEARING WARNING ⚠️"
    print_warning "This will permanently delete cached AI data!"
    print_warning "Type: $CACHE_TYPE"
    if [ -n "$PROVIDER" ]; then
        print_warning "Provider: $PROVIDER"
    fi
    echo ""
    
    read -p "Are you sure you want to continue? (type 'CLEAR' to confirm): " confirmation
    
    if [ "$confirmation" != "CLEAR" ]; then
        print_status "Cache clearing cancelled"
        exit 0
    fi
}

# Show summary
show_summary() {
    local total_cleared="$1"
    local total_failed="$2"
    
    echo ""
    print_status "Cache Clearing Summary:"
    echo "  Type: $CACHE_TYPE"
    echo "  Provider: ${PROVIDER:-All}"
    echo "  Mode: $([ "$DRY_RUN" = true ] && echo "Dry run" || echo "Execute")"
    echo "  Cleared: $total_cleared items"
    echo "  Failed: $total_failed items"
    echo "  Timestamp: $(date)"
    
    if [ "$total_failed" -eq 0 ] && [ "$DRY_RUN" = false ]; then
        print_success "All caches cleared successfully!"
    elif [ "$total_failed" -gt 0 ]; then
        print_warning "Some items failed to clear. Check logs above."
    fi
    
    echo ""
    print_status "Recommendations:"
    echo "  1. Restart AI services to ensure fresh state"
    echo "  2. Clear browser cache if experiencing issues"
    echo "  3. Monitor cache size regularly"
    echo "  4. Consider setting up automated cache cleanup"
}

# Main cache clearing function
main() {
    print_status "Starting AI cache clearing..."
    
    # Check project structure
    check_project_structure
    
    # Confirmation for non-dry run
    confirm_clear
    
    local total_cleared=0
    local total_failed=0
    
    # Clear based on type
    case "$CACHE_TYPE" in
        all)
            print_status "Clearing all AI-related caches..."
            clear_api_caches; ((total_failed += $?))
            clear_response_caches; ((total_failed += $?))
            clear_embedding_caches; ((total_failed += $?))
            clear_model_caches; ((total_failed += $?))
            clear_temp_files; ((total_failed += $?))
            clear_browser_caches; ((total_failed += $?))
            clear_redis_cache
            clear_memory_caches
            ;;
        api)
            clear_api_caches; ((total_failed += $?))
            ;;
        responses)
            clear_response_caches; ((total_failed += $?))
            ;;
        embeddings)
            clear_embedding_caches; ((total_failed += $?))
            ;;
        models)
            clear_model_caches; ((total_failed += $?))
            ;;
        temp)
            clear_temp_files; ((total_failed += $?))
            ;;
        path)
            clear_specific_path; ((total_failed += $?))
            ;;
        *)
            print_error "Unknown cache type: $CACHE_TYPE"
            print_status "Use: all, api, responses, embeddings, models, temp, path"
            exit 1
            ;;
    esac
    
    # Show summary
    show_summary $total_cleared $total_failed
    
    if [ "$DRY_RUN" = false ]; then
        print_status "Cache clearing completed!"
        echo ""
        print_status "Next steps:"
        echo "  1. Restart development server: npm run dev"
        echo "  2. Test AI functionality"
        echo "  3. Monitor cache rebuild"
    fi
}

# Handle script interruption
trap 'print_error "Cache clearing interrupted."' INT

# Run main function
main "$@"