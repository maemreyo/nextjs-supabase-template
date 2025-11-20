#!/bin/bash

# Development Setup Script
# This script sets up the development environment for the Next.js Supabase template

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm version: $NPM_VERSION"
}

# Check if Supabase CLI is installed
check_supabase() {
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI is not installed. Installing now..."
        npm install -g supabase
        
        if ! command -v supabase &> /dev/null; then
            print_error "Failed to install Supabase CLI. Please install it manually."
            exit 1
        fi
    fi
    
    SUPABASE_VERSION=$(supabase --version)
    print_success "Supabase CLI version: $SUPABASE_VERSION"
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencies installed successfully"
    else
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_success "Created .env.local from .env.example"
            print_warning "Please update .env.local with your actual values"
        else
            print_warning ".env.example not found. Creating basic .env.local..."
            cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Provider Configuration (optional)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
EOF
            print_success "Created basic .env.local"
        fi
    else
        print_status ".env.local already exists"
    fi
}

# Initialize Supabase
init_supabase() {
    print_status "Initializing Supabase..."
    
    if [ ! -d "supabase" ]; then
        supabase init
        print_success "Supabase initialized"
    else
        print_status "Supabase already initialized"
    fi
}

# Generate TypeScript types
generate_types() {
    print_status "Generating TypeScript types..."
    
    # Try to generate from remote project first
    if npm run db:generate-types-remote 2>/dev/null; then
        print_success "TypeScript types generated from remote project"
    else
        print_warning "Failed to generate types from remote project. Trying local..."
        if npm run db:generate 2>/dev/null; then
            print_success "TypeScript types generated from local project"
        else
            print_warning "Could not generate TypeScript types. You can run this manually later."
        fi
    fi
}

# Run initial checks
run_checks() {
    print_status "Running initial checks..."
    
    # Type check
    if npm run type-check 2>/dev/null; then
        print_success "TypeScript compilation successful"
    else
        print_warning "TypeScript compilation failed. Please check for errors."
    fi
    
    # Lint check
    if npm run lint 2>/dev/null; then
        print_success "Linting passed"
    else
        print_warning "Linting failed. Run 'npm run lint:fix' to fix issues."
    fi
}

# Main setup process
main() {
    print_status "Starting development environment setup..."
    
    # Check prerequisites
    check_node
    check_npm
    check_supabase
    
    # Setup project
    install_dependencies
    setup_env
    init_supabase
    generate_types
    run_checks
    
    print_success "Development environment setup completed!"
    echo ""
    print_status "Next steps:"
    echo "  1. Update .env.local with your actual configuration values"
    echo "  2. Run 'npm run dev' to start the development server"
    echo "  3. Run 'npm run supabase:start' to start Supabase locally (if needed)"
    echo ""
    print_status "Useful commands:"
    echo "  - npm run dev              # Start development server"
    echo "  - npm run build            # Build for production"
    echo "  - npm run test             # Run tests"
    echo "  - npm run lint:fix         # Fix linting issues"
    echo "  - npm run db:generate-types-remote  # Update TypeScript types"
}

# Handle script interruption
trap 'print_error "Setup interrupted. Please run the script again."' INT

# Run main function
main "$@"