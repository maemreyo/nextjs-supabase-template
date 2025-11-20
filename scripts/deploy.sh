#!/bin/bash

# Deployment Script
# This script handles deployment to various platforms

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
PLATFORM=""
ENVIRONMENT="production"
BUILD_ONLY=false
SKIP_TESTS=false
SKIP_LINT=false
SKIP_BUILD=false
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --platform|-p)
            PLATFORM="$2"
            shift 2
            ;;
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --build-only|-b)
            BUILD_ONLY=true
            shift
            ;;
        --skip-tests|-t)
            SKIP_TESTS=true
            shift
            ;;
        --skip-lint|-l)
            SKIP_LINT=true
            shift
            ;;
        --skip-build|-s)
            SKIP_BUILD=true
            shift
            ;;
        --dry-run|-d)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --platform, -p        Deployment platform (vercel, netlify, aws, custom)"
            echo "  --environment, -e      Target environment (production, staging, development)"
            echo "  --build-only, -b      Build only, don't deploy"
            echo "  --skip-tests, -t      Skip running tests"
            echo "  --skip-lint, -l       Skip linting"
            echo "  --skip-build, -s      Skip building (use existing build)"
            echo "  --dry-run, -d         Show what would be done without executing"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --platform vercel                    # Deploy to Vercel (production)"
            echo "  $0 --platform netlify --environment staging  # Deploy to Netlify staging"
            echo "  $0 --build-only                        # Build only, don't deploy"
            echo "  $0 --dry-run --platform vercel         # Show deployment plan"
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
        print_error "package.json not found. Please run this script from project root."
        exit 1
    fi
    
    if [ ! -d "src" ]; then
        print_error "src directory not found. Please run this script from project root."
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
    
    # Platform-specific checks
    case "$PLATFORM" in
        vercel)
            if ! command -v vercel &> /dev/null; then
                print_error "Vercel CLI is not installed. Install with: npm i -g vercel"
                exit 1
            fi
            ;;
        netlify)
            if ! command -v netlify &> /dev/null; then
                print_error "Netlify CLI is not installed. Install with: npm i -g netlify-cli"
                exit 1
            fi
            ;;
        aws)
            if ! command -v aws &> /dev/null; then
                print_error "AWS CLI is not installed. Install with: npm i -g aws-cli"
                exit 1
            fi
            ;;
    esac
    
    print_success "Required tools are installed"
}

# Run tests if not skipped
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping tests as requested"
        return
    fi
    
    print_status "Running tests..."
    
    if npm run test 2>/dev/null; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Run linting if not skipped
run_lint() {
    if [ "$SKIP_LINT" = true ]; then
        print_warning "Skipping linting as requested"
        return
    fi
    
    print_status "Running linting..."
    
    if npm run lint 2>/dev/null; then
        print_success "Linting passed"
    else
        print_error "Linting failed. Run 'npm run lint:fix' to fix issues"
        exit 1
    fi
}

# Build the application
build_app() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "Skipping build as requested"
        return
    fi
    
    print_status "Building application for $ENVIRONMENT..."
    
    # Set environment-specific build flags
    BUILD_ARGS=""
    if [ "$ENVIRONMENT" = "production" ]; then
        BUILD_ARGS="--max-old-space-size=4096"
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_status "[DRY RUN] Would run: npm run build"
        return
    fi
    
    if NODE_OPTIONS="$BUILD_ARGS" npm run build; then
        print_success "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel ($ENVIRONMENT)..."
    
    if [ "$DRY_RUN" = true ]; then
        print_status "[DRY RUN] Would deploy to Vercel"
        return
    fi
    
    # Set Vercel-specific environment
    export VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
    export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"
    
    case "$ENVIRONMENT" in
        production)
            vercel --prod
            ;;
        staging)
            vercel --prod
            ;;
        development|preview)
            vercel
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    print_success "Deployed to Vercel successfully"
}

# Deploy to Netlify
deploy_to_netlify() {
    print_status "Deploying to Netlify ($ENVIRONMENT)..."
    
    if [ "$DRY_RUN" = true ]; then
        print_status "[DRY RUN] Would deploy to Netlify"
        return
    fi
    
    # Check if build directory exists
    if [ ! -d ".next" ]; then
        print_error "Build directory not found. Please build the application first."
        exit 1
    fi
    
    case "$ENVIRONMENT" in
        production)
            netlify deploy --prod --dir=.next
            ;;
        staging)
            netlify deploy --prod --dir=.next
            ;;
        development|preview)
            netlify deploy --dir=.next
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    print_success "Deployed to Netlify successfully"
}

# Deploy to AWS S3
deploy_to_aws() {
    print_status "Deploying to AWS S3 ($ENVIRONMENT)..."
    
    if [ "$DRY_RUN" = true ]; then
        print_status "[DRY RUN] Would deploy to AWS S3"
        return
    fi
    
    # Configuration
    BUCKET_NAME="${AWS_BUCKET_NAME:-}"
    DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID:-}"
    
    if [ -z "$BUCKET_NAME" ]; then
        print_error "AWS_BUCKET_NAME environment variable is required"
        exit 1
    fi
    
    # Sync to S3
    aws s3 sync .next/ "s3://$BUCKET_NAME" --delete
    
    # Invalidate CloudFront if distribution ID is provided
    if [ -n "$DISTRIBUTION_ID" ]; then
        aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
    fi
    
    print_success "Deployed to AWS S3 successfully"
}

# Custom deployment
deploy_custom() {
    print_status "Running custom deployment..."
    
    if [ -f "scripts/custom-deploy.sh" ]; then
        if [ "$DRY_RUN" = true ]; then
            print_status "[DRY RUN] Would run custom deployment script"
        else
            ./scripts/custom-deploy.sh "$ENVIRONMENT"
        fi
        print_success "Custom deployment completed"
    else
        print_error "Custom deployment script not found: scripts/custom-deploy.sh"
        exit 1
    fi
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    # Validate input
    if [ -z "$PLATFORM" ]; then
        print_error "Platform is required. Use --platform to specify deployment platform"
        exit 1
    fi
    
    # Check project structure
    check_project_structure
    
    # Check required tools
    check_tools
    
    # Pre-deployment checks
    run_tests
    run_lint
    
    # Build application
    build_app
    
    # Exit if build-only mode
    if [ "$BUILD_ONLY" = true ]; then
        print_success "Build completed successfully"
        exit 0
    fi
    
    # Deploy based on platform
    case "$PLATFORM" in
        vercel)
            deploy_to_vercel
            ;;
        netlify)
            deploy_to_netlify
            ;;
        aws)
            deploy_to_aws
            ;;
        custom)
            deploy_custom
            ;;
        *)
            print_error "Unsupported platform: $PLATFORM"
            print_status "Supported platforms: vercel, netlify, aws, custom"
            exit 1
            ;;
    esac
    
    print_success "Deployment completed successfully!"
    echo ""
    print_status "Deployment summary:"
    echo "  Platform: $PLATFORM"
    echo "  Environment: $ENVIRONMENT"
    echo "  Timestamp: $(date)"
    echo ""
    print_status "Post-deployment:"
    echo "  1. Verify the deployment is working"
    echo "  2. Check application logs for any issues"
    echo "  3. Monitor performance and error rates"
}

# Handle script interruption
trap 'print_error "Deployment interrupted."' INT

# Run main function
main "$@"