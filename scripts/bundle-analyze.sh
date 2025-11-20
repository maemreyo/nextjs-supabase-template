#!/bin/bash

# Bundle Analysis Script
# This script analyzes the bundle size and provides optimization suggestions

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
ANALYZE=false
COMPARE=false
BASE_BRANCH="main"
OUTPUT_DIR=".next/analyze"
THRESHOLD_MB=5
OPEN_REPORT=false
JSON_OUTPUT=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --analyze|-a)
            ANALYZE=true
            shift
            ;;
        --compare|-c)
            COMPARE=true
            shift
            ;;
        --base-branch|-b)
            BASE_BRANCH="$2"
            shift 2
            ;;
        --output|-o)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --threshold|-t)
            THRESHOLD_MB="$2"
            shift 2
            ;;
        --open|-r)
            OPEN_REPORT=true
            shift
            ;;
        --json|-j)
            JSON_OUTPUT=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --analyze, -a          Analyze bundle size (sets ANALYZE=true)"
            echo "  --compare, -c          Compare with base branch"
            echo "  --base-branch, -b      Base branch for comparison (default: main)"
            echo "  --output, -o           Output directory for analysis (default: .next/analyze)"
            echo "  --threshold, -t         Size threshold in MB (default: 5)"
            echo "  --open, -r             Open analysis report in browser"
            echo "  --json, -j             Output results in JSON format"
            echo "  --help, -h             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --analyze                    # Analyze current bundle"
            echo "  $0 --compare                    # Compare with main branch"
            echo "  $0 --threshold 2 --open         # Analyze with 2MB threshold and open report"
            echo "  ANALYZE=true $0                 # Alternative way to analyze"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if ANALYZE environment variable is set
if [ "$ANALYZE" = false ] && [ "$ANALYZE" = true ]; then
    ANALYZE=true
fi

# Check if we're in the right directory
check_project_structure() {
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    if [ ! -f "next.config.ts" ] && [ ! -f "next.config.js" ]; then
        print_error "Next.js config file not found."
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
    
    print_success "Required tools are available"
}

# Check if @next/bundle-analyzer is installed
check_bundle_analyzer() {
    if ! grep -q "@next/bundle-analyzer" package.json; then
        print_warning "@next/bundle-analyzer not found in package.json"
        print_status "Installing @next/bundle-analyzer..."
        npm install --save-dev @next/bundle-analyzer
        print_success "@next/bundle-analyzer installed"
    fi
}

# Clean previous build and analysis
clean_previous_build() {
    print_status "Cleaning previous build and analysis..."
    
    # Remove .next directory
    if [ -d ".next" ]; then
        rm -rf .next
        print_status "Removed .next directory"
    fi
    
    # Remove output directory
    if [ -d "$OUTPUT_DIR" ]; then
        rm -rf "$OUTPUT_DIR"
        print_status "Removed $OUTPUT_DIR directory"
    fi
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
}

# Build application with analysis
build_with_analysis() {
    print_status "Building application with bundle analysis..."
    
    # Set environment variables for analysis
    export ANALYZE=true
    export BUNDLE_ANALYZER_OUTPUT_DIR="$OUTPUT_DIR"
    
    if npm run build; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Analyze bundle size
analyze_bundle() {
    if [ "$ANALYZE" != true ]; then
        return
    fi
    
    print_status "Analyzing bundle size..."
    
    # Check if analysis report was generated
    if [ -f "$OUTPUT_DIR/client.html" ]; then
        print_success "Bundle analysis report generated: $OUTPUT_DIR/client.html"
        
        if [ "$OPEN_REPORT" = true ]; then
            print_status "Opening bundle analysis report..."
            if command -v open &> /dev/null; then
                open "$OUTPUT_DIR/client.html"
            elif command -v xdg-open &> /dev/null; then
                xdg-open "$OUTPUT_DIR/client.html"
            else
                print_warning "Could not open browser automatically"
                print_status "Open manually: file://$(pwd)/$OUTPUT_DIR/client.html"
            fi
        fi
    else
        print_warning "Bundle analysis report not found"
    fi
}

# Get bundle size information
get_bundle_size() {
    local bundle_path="$1"
    
    if [ -f "$bundle_path" ]; then
        # Get file size in bytes
        local size_bytes=$(stat -f%z "$bundle_path" 2>/dev/null || stat -c%s "$bundle_path" 2>/dev/null || echo "0")
        
        # Convert to MB
        local size_mb=$(echo "scale=2; $size_bytes / 1024 / 1024" | bc -l 2>/dev/null || echo "0")
        
        echo "$size_mb"
    else
        echo "0"
    fi
}

# Check bundle size against threshold
check_bundle_threshold() {
    print_status "Checking bundle size against threshold..."
    
    # Look for main bundle files
    local main_bundle=".next/static/chunks/pages/_app-*.js"
    local main_bundle_size=0
    
    for bundle in $main_bundle; do
        if [ -f "$bundle" ]; then
            local size=$(get_bundle_size "$bundle")
            main_bundle_size=$size
            break
        fi
    done
    
    # Convert threshold to float for comparison
    local threshold_float=$(echo "$THRESHOLD_MB" | bc -l 2>/dev/null || echo "$THRESHOLD_MB")
    
    if (( $(echo "$main_bundle_size > $threshold_float" | bc -l 2>/dev/null || echo "0") )); then
        print_warning "Main bundle size (${main_bundle_size}MB) exceeds threshold (${THRESHOLD_MB}MB)"
        print_status "Consider the following optimizations:"
        echo "  1. Code splitting for large components"
        echo "  2. Dynamic imports for rarely used code"
        echo "  3. Tree shaking for unused exports"
        echo "  4. Image and asset optimization"
        echo "  5. External vendor chunking"
        return 1
    else
        print_success "Main bundle size (${main_bundle_size}MB) is within threshold (${THRESHOLD_MB}MB)"
        return 0
    fi
}

# Generate bundle analysis summary
generate_summary() {
    print_status "Generating bundle analysis summary..."
    
    local summary_file="$OUTPUT_DIR/bundle-summary.txt"
    
    cat > "$summary_file" << EOF
Bundle Analysis Summary
=====================
Generated: $(date)
Project: $(basename $(pwd))
Threshold: ${THRESHOLD_MB}MB

Bundle Sizes:
--------------

EOF
    
    # Find all JavaScript bundles
    find .next/static -name "*.js" -type f 2>/dev/null | while read bundle; do
        local size=$(get_bundle_size "$bundle")
        local name=$(basename "$bundle")
        echo "  $name: ${size}MB" >> "$summary_file"
    done
    
    cat >> "$summary_file" << EOF

Optimization Suggestions:
------------------------
1. Use dynamic imports for large components
2. Implement code splitting at route level
3. Externalize large vendor libraries
4. Use next/image for image optimization
5. Enable compression for static assets
6. Consider using CDN for static assets
7. Review and remove unused dependencies
8. Implement lazy loading for below-the-fold content

Next Steps:
-----------
1. Review the detailed HTML report at client.html
2. Identify largest chunks and dependencies
3. Implement code splitting where appropriate
4. Re-run analysis to verify improvements
EOF
    
    print_success "Bundle analysis summary generated: $summary_file"
    
    if [ "$JSON_OUTPUT" = true ]; then
        generate_json_summary
    fi
}

# Generate JSON summary
generate_json_summary() {
    local json_file="$OUTPUT_DIR/bundle-summary.json"
    
    cat > "$json_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "project": "$(basename $(pwd))",
  "threshold": ${THRESHOLD_MB},
  "bundles": [
EOF
    
    local first=true
    find .next/static -name "*.js" -type f 2>/dev/null | while read bundle; do
        local size=$(get_bundle_size "$bundle")
        local name=$(basename "$bundle")
        
        if [ "$first" = false ]; then
            echo "," >> "$json_file"
        fi
        
        cat >> "$json_file" << EOF
    {
      "name": "$name",
      "path": "$bundle",
      "size_mb": $size
    }
EOF
        first=false
    done
    
    cat >> "$json_file" << EOF
  ]
}
EOF
    
    print_success "JSON summary generated: $json_file"
}

# Compare with base branch
compare_with_base() {
    if [ "$COMPARE" != true ]; then
        return
    fi
    
    print_status "Comparing with base branch: $BASE_BRANCH"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir &> /dev/null; then
        print_warning "Not in a git repository. Skipping comparison."
        return
    fi
    
    # Check if base branch exists
    if ! git rev-parse --verify "$BASE_BRANCH" &> /dev/null; then
        print_warning "Base branch '$BASE_BRANCH' not found. Skipping comparison."
        return
    fi
    
    # Get current bundle sizes
    local current_sizes=$(find .next/static -name "*.js" -exec stat -f%z {} \; 2>/dev/null | awk '{sum += $1} END {print sum/1024/1024}' || echo "0")
    
    # Stash current changes
    git stash push -m "bundle-analyze-stash" 2>/dev/null || true
    
    # Checkout base branch
    git checkout "$BASE_BRANCH" 2>/dev/null || true
    
    # Build base branch
    clean_previous_build
    if npm run build 2>/dev/null; then
        local base_sizes=$(find .next/static -name "*.js" -exec stat -f%z {} \; 2>/dev/null | awk '{sum += $1} END {print sum/1024/1024}' || echo "0")
        
        # Calculate difference
        local diff=$(echo "scale=2; $current_sizes - $base_sizes" | bc -l 2>/dev/null || echo "0")
        
        if (( $(echo "$diff > 0" | bc -l 2>/dev/null || echo "0") )); then
            print_warning "Bundle size increased by ${diff}MB compared to $BASE_BRANCH"
        else
            print_success "Bundle size decreased by ${diff#-}MB compared to $BASE_BRANCH"
        fi
    else
        print_warning "Could not build base branch for comparison"
    fi
    
    # Return to original branch
    git checkout - 2>/dev/null || true
    git stash pop 2>/dev/null || true
    
    # Rebuild current branch
    build_with_analysis
}

# Show optimization suggestions
show_optimization_suggestions() {
    print_status "Bundle Optimization Suggestions:"
    echo ""
    echo "📦 Code Splitting:"
    echo "  - Use dynamic imports() for large components"
    echo "  - Implement route-based code splitting"
    echo "  - Split vendor libraries separately"
    echo ""
    echo "🖼️ Asset Optimization:"
    echo "  - Use next/image for automatic optimization"
    echo "  - Compress images and use appropriate formats"
    echo "  - Implement lazy loading for images"
    echo ""
    echo "📚 Dependencies:"
    echo "  - Review and remove unused packages"
    echo "  - Use tree-shakable imports"
    echo "  - Consider smaller alternatives for large libraries"
    echo ""
    echo "⚡ Performance:"
    echo "  - Enable gzip/brotli compression"
    echo "  - Use CDN for static assets"
    echo "  - Implement caching strategies"
    echo ""
    echo "🔍 Analysis Tools:"
    echo "  - Use Lighthouse for performance audit"
    echo "  - Monitor bundle size in CI/CD"
    echo "  - Set up bundle size alerts"
}

# Main bundle analysis process
main() {
    print_status "Starting bundle analysis process..."
    
    # Prerequisites
    check_project_structure
    check_tools
    check_bundle_analyzer
    
    # Clean previous build
    clean_previous_build
    
    # Build with analysis
    build_with_analysis
    
    # Analyze bundle
    analyze_bundle
    
    # Check against threshold
    check_bundle_threshold
    
    # Compare with base branch if requested
    compare_with_base
    
    # Generate summary
    generate_summary
    
    # Show optimization suggestions
    show_optimization_suggestions
    
    print_success "Bundle analysis completed!"
    echo ""
    print_status "Reports generated:"
    echo "  - HTML Report: $OUTPUT_DIR/client.html"
    echo "  - Text Summary: $OUTPUT_DIR/bundle-summary.txt"
    if [ "$JSON_OUTPUT" = true ]; then
        echo "  - JSON Summary: $OUTPUT_DIR/bundle-summary.json"
    fi
    echo ""
    print_status "Next steps:"
    echo "  1. Review the HTML report for detailed analysis"
    echo "  2. Identify largest chunks and dependencies"
    echo "  3. Implement optimization suggestions"
    echo "  4. Re-run analysis to verify improvements"
}

# Handle script interruption
trap 'print_error "Bundle analysis interrupted."' INT

# Run main function
main "$@"