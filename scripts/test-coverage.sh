#!/bin/bash

# Test Coverage Script
# This script runs tests with coverage analysis and reporting

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
COVERAGE_DIR="coverage"
THRESHOLD=80
WATCH=false
OPEN_REPORT=false
UPLOAD_TO_COVERAGE_SERVICE=false
SPECIFIC_TEST_FILE=""
UNIT_TESTS=true
INTEGRATION_TESTS=true
E2E_TESTS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --threshold|-t)
            THRESHOLD="$2"
            shift 2
            ;;
        --watch|-w)
            WATCH=true
            shift
            ;;
        --open|-o)
            OPEN_REPORT=true
            shift
            ;;
        --upload|-u)
            UPLOAD_TO_COVERAGE_SERVICE=true
            shift
            ;;
        --file|-f)
            SPECIFIC_TEST_FILE="$2"
            shift 2
            ;;
        --unit-only)
            UNIT_TESTS=true
            INTEGRATION_TESTS=false
            E2E_TESTS=false
            shift
            ;;
        --integration-only)
            UNIT_TESTS=false
            INTEGRATION_TESTS=true
            E2E_TESTS=false
            shift
            ;;
        --e2e-only)
            UNIT_TESTS=false
            INTEGRATION_TESTS=false
            E2E_TESTS=true
            shift
            ;;
        --all-tests)
            UNIT_TESTS=true
            INTEGRATION_TESTS=true
            E2E_TESTS=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --threshold, -t        Coverage threshold percentage (default: 80)"
            echo "  --watch, -w           Run tests in watch mode"
            echo "  --open, -o            Open coverage report in browser"
            echo "  --upload, -u          Upload coverage to service (Codecov, etc.)"
            echo "  --file, -f            Run specific test file"
            echo "  --unit-only           Run only unit tests"
            echo "  --integration-only     Run only integration tests"
            echo "  --e2e-only            Run only E2E tests"
            echo "  --all-tests           Run all test types (unit, integration, E2E)"
            echo "  --help, -h            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Run unit and integration tests with coverage"
            echo "  $0 --threshold 90             # Require 90% coverage"
            echo "  $0 --watch --open            # Watch mode and open report"
            echo "  $0 --file src/app.test.tsx    # Run specific test file"
            echo "  $0 --all-tests               # Run all test types"
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
    
    # Check if Jest is available
    if ! npm run test --version &> /dev/null; then
        print_error "Jest is not available. Check package.json scripts."
        exit 1
    fi
    
    # Check if Playwright is available for E2E tests
    if [ "$E2E_TESTS" = true ] && ! npm run test:e2e --version &> /dev/null; then
        print_warning "Playwright is not available. E2E tests will be skipped."
        E2E_TESTS=false
    fi
    
    print_success "Required tools are available"
}

# Clean previous coverage
clean_coverage() {
    if [ -d "$COVERAGE_DIR" ]; then
        print_status "Cleaning previous coverage reports..."
        rm -rf "$COVERAGE_DIR"
    fi
    
    # Remove any coverage files
    find . -name "*.lcov" -delete 2>/dev/null || true
    find . -name "coverage.json" -delete 2>/dev/null || true
}

# Run unit tests with coverage
run_unit_tests() {
    if [ "$UNIT_TESTS" != true ]; then
        return
    fi
    
    print_status "Running unit tests with coverage..."
    
    local jest_args=""
    
    if [ -n "$SPECIFIC_TEST_FILE" ]; then
        jest_args="$SPECIFIC_TEST_FILE"
    fi
    
    if [ "$WATCH" = true ]; then
        jest_args="$jest_args --watch"
    fi
    
    jest_args="$jest_args --coverage --coverageThreshold=\"{\\\"global\\\": {\\\"lines\\\": $THRESHOLD, \\\"functions\\\": $THRESHOLD, \\\"branches\\\": $THRESHOLD, \\\"statements\\\": $THRESHOLD}}\""
    
    if npm run test:coverage -- $jest_args; then
        print_success "Unit tests passed coverage threshold"
    else
        print_error "Unit tests failed or below coverage threshold ($THRESHOLD%)"
        return 1
    fi
}

# Run integration tests with coverage
run_integration_tests() {
    if [ "$INTEGRATION_TESTS" != true ]; then
        return
    fi
    
    print_status "Running integration tests with coverage..."
    
    # Look for integration test files
    local integration_files=$(find src -name "*.integration.test.*" -o -name "*.integration.spec.*" 2>/dev/null || true)
    
    if [ -z "$integration_files" ]; then
        print_warning "No integration test files found"
        return
    fi
    
    local jest_args="--testPathPattern=integration --coverage --coverageDirectory=coverage/integration"
    
    if [ "$WATCH" = true ]; then
        jest_args="$jest_args --watch"
    fi
    
    if npm run test:coverage -- $jest_args; then
        print_success "Integration tests passed"
    else
        print_warning "Integration tests failed"
        return 1
    fi
}

# Run E2E tests with coverage
run_e2e_tests() {
    if [ "$E2E_TESTS" != true ]; then
        return
    fi
    
    print_status "Running E2E tests..."
    
    local playwright_args=""
    
    if [ -n "$SPECIFIC_TEST_FILE" ]; then
        playwright_args="$SPECIFIC_TEST_FILE"
    fi
    
    # E2E tests typically don't generate coverage in the same way
    # but we can still run them and collect metrics
    if npm run test:e2e -- $playwright_args; then
        print_success "E2E tests passed"
    else
        print_error "E2E tests failed"
        return 1
    fi
}

# Generate coverage report
generate_coverage_report() {
    if [ ! -d "$COVERAGE_DIR" ]; then
        print_warning "No coverage directory found"
        return
    fi
    
    print_status "Generating coverage report..."
    
    # Check if lcov.info exists
    if [ -f "$COVERAGE_DIR/lcov.info" ]; then
        print_success "LCOV report generated: $COVERAGE_DIR/lcov.info"
        
        # Generate summary
        if command -v lcov &> /dev/null; then
            lcov --summary "$COVERAGE_DIR/lcov.info" 2>/dev/null || true
        fi
    fi
    
    # Check if HTML report exists
    if [ -f "$COVERAGE_DIR/lcov-report/index.html" ]; then
        print_success "HTML coverage report generated: $COVERAGE_DIR/lcov-report/index.html"
        
        if [ "$OPEN_REPORT" = true ]; then
            print_status "Opening coverage report in browser..."
            if command -v open &> /dev/null; then
                open "$COVERAGE_DIR/lcov-report/index.html"
            elif command -v xdg-open &> /dev/null; then
                xdg-open "$COVERAGE_DIR/lcov-report/index.html"
            else
                print_warning "Could not open browser automatically"
                print_status "Open manually: file://$(pwd)/$COVERAGE_DIR/lcov-report/index.html"
            fi
        fi
    fi
}

# Upload coverage to service
upload_coverage() {
    if [ "$UPLOAD_TO_COVERAGE_SERVICE" != true ]; then
        return
    fi
    
    print_status "Uploading coverage to service..."
    
    # Check if codecov is available
    if command -v codecov &> /dev/null; then
        codecov
        print_success "Coverage uploaded to Codecov"
    elif [ -f "package.json" ] && grep -q "codecov" package.json; then
        npx codecov
        print_success "Coverage uploaded to Codecov"
    else
        print_warning "Codecov not available. Install with: npm install -g codecov"
        print_status "Or add to package.json: npm install --save-dev codecov"
    fi
}

# Show coverage summary
show_coverage_summary() {
    if [ ! -d "$COVERAGE_DIR" ]; then
        return
    fi
    
    print_status "Coverage Summary:"
    
    # Try to extract coverage from coverage summary file
    if [ -f "$COVERAGE_DIR/coverage-summary.json" ]; then
        if command -v jq &> /dev/null; then
            local lines=$(jq -r '.total.lines.pct' "$COVERAGE_DIR/coverage-summary.json" 2>/dev/null || echo "N/A")
            local functions=$(jq -r '.total.functions.pct' "$COVERAGE_DIR/coverage-summary.json" 2>/dev/null || echo "N/A")
            local branches=$(jq -r '.total.branches.pct' "$COVERAGE_DIR/coverage-summary.json" 2>/dev/null || echo "N/A")
            local statements=$(jq -r '.total.statements.pct' "$COVERAGE_DIR/coverage-summary.json" 2>/dev/null || echo "N/A")
            
            echo "  Lines: $lines%"
            echo "  Functions: $functions%"
            echo "  Branches: $branches%"
            echo "  Statements: $statements%"
        else
            print_warning "Install jq for detailed coverage summary"
        fi
    fi
    
    echo "  Threshold: $THRESHOLD%"
    echo "  Report: $COVERAGE_DIR/lcov-report/index.html"
}

# Check coverage against threshold
check_coverage_threshold() {
    if [ ! -f "$COVERAGE_DIR/coverage-summary.json" ]; then
        return
    fi
    
    if command -v jq &> /dev/null; then
        local lines=$(jq -r '.total.lines.pct' "$COVERAGE_DIR/coverage-summary.json" 2>/dev/null || echo "0")
        local functions=$(jq -r '.total.functions.pct' "$COVERAGE_DIR/coverage-summary.json" 2>/dev/null || echo "0")
        local branches=$(jq -r '.total.branches.pct' "$COVERAGE_DIR/coverage-summary.json" 2>/dev/null || echo "0")
        local statements=$(jq -r '.total.statements.pct' "$COVERAGE_DIR/coverage-summary.json" 2>/dev/null || echo "0")
        
        # Convert to integers for comparison
        lines_int=${lines%.*}
        functions_int=${functions%.*}
        branches_int=${branches%.*}
        statements_int=${statements%.*}
        
        local below_threshold=false
        
        if [ "$lines_int" -lt "$THRESHOLD" ]; then
            print_warning "Lines coverage ($lines%) is below threshold ($THRESHOLD%)"
            below_threshold=true
        fi
        
        if [ "$functions_int" -lt "$THRESHOLD" ]; then
            print_warning "Functions coverage ($functions%) is below threshold ($THRESHOLD%)"
            below_threshold=true
        fi
        
        if [ "$branches_int" -lt "$THRESHOLD" ]; then
            print_warning "Branches coverage ($branches%) is below threshold ($THRESHOLD%)"
            below_threshold=true
        fi
        
        if [ "$statements_int" -lt "$THRESHOLD" ]; then
            print_warning "Statements coverage ($statements%) is below threshold ($THRESHOLD%)"
            below_threshold=true
        fi
        
        if [ "$below_threshold" = true ]; then
            print_error "Coverage is below threshold. Please add more tests."
            return 1
        else
            print_success "All coverage metrics meet or exceed threshold ($THRESHOLD%)"
        fi
    fi
}

# Main test coverage process
main() {
    print_status "Starting test coverage process..."
    
    # Prerequisites
    check_project_structure
    check_tools
    
    # Clean previous coverage
    clean_coverage
    
    # Run tests based on configuration
    local test_failed=false
    
    if ! run_unit_tests; then
        test_failed=true
    fi
    
    if ! run_integration_tests; then
        test_failed=true
    fi
    
    if ! run_e2e_tests; then
        test_failed=true
    fi
    
    # Generate and analyze coverage
    generate_coverage_report
    show_coverage_summary
    
    # Check if coverage meets threshold
    if ! check_coverage_threshold; then
        test_failed=true
    fi
    
    # Upload coverage if requested
    upload_coverage
    
    # Final result
    echo ""
    if [ "$test_failed" = true ]; then
        print_error "Test coverage process completed with failures"
        exit 1
    else
        print_success "Test coverage process completed successfully!"
        echo ""
        print_status "Coverage report available at: $COVERAGE_DIR/lcov-report/index.html"
        print_status "To improve coverage:"
        echo "  1. Identify uncovered files in the report"
        echo "  2. Add tests for uncovered code paths"
        echo "  3. Re-run this script to verify improvements"
    fi
}

# Handle script interruption
trap 'print_error "Test coverage interrupted."' INT

# Run main function
main "$@"