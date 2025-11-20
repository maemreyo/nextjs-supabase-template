#!/bin/bash

# AI Providers Test Script
# This script tests connectivity and functionality of various AI providers

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

print_provider() {
    echo -e "${CYAN}[PROVIDER]${NC} $1"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# Default values
PROVIDER=""
TEST_TYPE="connectivity"
API_KEY=""
MODEL=""
VERBOSE=false
TIMEOUT=30
OUTPUT_FORMAT="table"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --provider|-p)
            PROVIDER="$2"
            shift 2
            ;;
        --test-type|-t)
            TEST_TYPE="$2"
            shift 2
            ;;
        --api-key|-k)
            API_KEY="$2"
            shift 2
            ;;
        --model|-m)
            MODEL="$2"
            shift 2
            ;;
        --timeout|-o)
            TIMEOUT="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --output|-f)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --all|-a)
            PROVIDER="all"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --provider, -p         AI provider to test (openai, anthropic, gemini, etc.)"
            echo "  --test-type, -t       Test type: connectivity, generation, analysis"
            echo "  --api-key, -k         API key for the provider"
            echo "  --model, -m            Specific model to test"
            echo "  --timeout, -o          Request timeout in seconds (default: 30)"
            echo "  --verbose, -v          Show detailed output"
            echo "  --output, -f           Output format: table, json, csv"
            echo "  --all, -a              Test all configured providers"
            echo "  --help, -h             Show this help message"
            echo ""
            echo "Test Types:"
            echo "  connectivity      Test API connectivity and authentication"
            echo "  generation       Test text generation capabilities"
            echo "  analysis         Test text analysis capabilities"
            echo ""
            echo "Examples:"
            echo "  $0 --provider openai --test-type connectivity"
            echo "  $0 --provider anthropic --test-type generation --model claude-3"
            echo "  $0 --all --test-type connectivity"
            echo "  $0 --provider gemini --verbose --output json"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Load environment variables
load_environment() {
    print_status "Loading environment variables..."
    
    # Load from .env.local if it exists
    if [ -f ".env.local" ]; then
        set -a
        source .env.local
        set +a
        print_status "Loaded .env.local"
    fi
    
    # Set default values if not provided
    if [ -z "$PROVIDER" ] && [ -n "$AI_PROVIDER" ]; then
        PROVIDER="$AI_PROVIDER"
    fi
    
    if [ -z "$API_KEY" ]; then
        case "$PROVIDER" in
            openai)
                API_KEY="${OPENAI_API_KEY:-}"
                ;;
            anthropic)
                API_KEY="${ANTHROPIC_API_KEY:-}"
                ;;
            gemini)
                API_KEY="${GEMINI_API_KEY:-}"
                ;;
            groq)
                API_KEY="${GROQ_API_KEY:-}"
                ;;
            cohere)
                API_KEY="${COHERE_API_KEY:-}"
                ;;
            openrouter)
                API_KEY="${OPENROUTER_API_KEY:-}"
                ;;
            zhipu)
                API_KEY="${ZHIPU_API_KEY:-}"
                ;;
            together)
                API_KEY="${TOGETHER_API_KEY:-}"
                ;;
        esac
    fi
    
    if [ -z "$MODEL" ]; then
        case "$PROVIDER" in
            openai)
                MODEL="${OPENAI_MODEL:-gpt-3.5-turbo}"
                ;;
            anthropic)
                MODEL="${ANTHROPIC_MODEL:-claude-3-sonnet-20240229}"
                ;;
            gemini)
                MODEL="${GEMINI_MODEL:-gemini-pro}"
                ;;
            groq)
                MODEL="${GROQ_MODEL:-llama2-70b-4096}"
                ;;
            cohere)
                MODEL="${COHERE_MODEL:-command}"
                ;;
            openrouter)
                MODEL="${OPENROUTER_MODEL:-meta-llama/llama-3-70b-instruct}"
                ;;
            zhipu)
                MODEL="${ZHIPU_MODEL:-glm-4}"
                ;;
            together)
                MODEL="${TOGETHER_MODEL:-meta-llama/Llama-3-8B-chat-hf}"
                ;;
        esac
    fi
}

# Check if required tools are installed
check_tools() {
    # Check curl
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    # Check jq for JSON parsing
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. JSON output will be limited"
    fi
    
    print_success "Required tools are available"
}

# Test OpenAI provider
test_openai() {
    print_provider "Testing OpenAI..."
    
    if [ -z "$API_KEY" ]; then
        print_error "OpenAI API key not found"
        return 1
    fi
    
    local api_url="https://api.openai.com/v1/models"
    local headers="Authorization: Bearer $API_KEY"
    
    case "$TEST_TYPE" in
        connectivity)
            print_test "Testing API connectivity..."
            if curl -s --max-time "$TIMEOUT" -H "$headers" "$api_url" | jq -e '.object' &> /dev/null; then
                print_success "OpenAI API connectivity: OK"
                return 0
            else
                print_error "OpenAI API connectivity: FAILED"
                return 1
            fi
            ;;
        generation)
            print_test "Testing text generation..."
            api_url="https://api.openai.com/v1/chat/completions"
            local payload='{
                "model": "'$MODEL'",
                "messages": [{"role": "user", "content": "Hello, respond with just \"OK\""}],
                "max_tokens": 10
            }'
            
            local response=$(curl -s --max-time "$TIMEOUT" -H "$headers" -H "Content-Type: application/json" -d "$payload" "$api_url")
            local content=$(echo "$response" | jq -r '.choices[0].message.content' 2>/dev/null || echo "")
            
            if [ "$content" = "OK" ] || [ "$content" = "\"OK\"" ]; then
                print_success "OpenAI text generation: OK"
                return 0
            else
                print_error "OpenAI text generation: FAILED"
                if [ "$VERBOSE" = true ]; then
                    echo "Response: $response"
                fi
                return 1
            fi
            ;;
        analysis)
            print_test "Testing text analysis..."
            api_url="https://api.openai.com/v1/embeddings"
            local payload='{
                "model": "text-embedding-ada-002",
                "input": "test text for embedding"
            }'
            
            if curl -s --max-time "$TIMEOUT" -H "$headers" -H "Content-Type: application/json" -d "$payload" "$api_url" | jq -e '.data[0].embedding' &> /dev/null; then
                print_success "OpenAI text analysis: OK"
                return 0
            else
                print_error "OpenAI text analysis: FAILED"
                return 1
            fi
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            return 1
            ;;
    esac
}

# Test Anthropic provider
test_anthropic() {
    print_provider "Testing Anthropic..."
    
    if [ -z "$API_KEY" ]; then
        print_error "Anthropic API key not found"
        return 1
    fi
    
    local api_url="https://api.anthropic.com/v1/messages"
    local headers="x-api-key: $API_KEY"
    local anthropic_version="anthropic-version: 2023-06-01"
    
    case "$TEST_TYPE" in
        connectivity)
            print_test "Testing API connectivity..."
            if curl -s --max-time "$TIMEOUT" -H "$headers" -H "$anthropic_version" "$api_url" | jq -e '.type' &> /dev/null; then
                print_success "Anthropic API connectivity: OK"
                return 0
            else
                print_error "Anthropic API connectivity: FAILED"
                return 1
            fi
            ;;
        generation)
            print_test "Testing text generation..."
            local payload='{
                "model": "'$MODEL'",
                "max_tokens": 10,
                "messages": [{"role": "user", "content": "Hello, respond with just \"OK\""}]
            }'
            
            local response=$(curl -s --max-time "$TIMEOUT" -H "$headers" -H "$anthropic_version" -H "Content-Type: application/json" -d "$payload" "$api_url")
            local content=$(echo "$response" | jq -r '.content[0].text' 2>/dev/null || echo "")
            
            if [ "$content" = "OK" ] || [ "$content" = "\"OK\"" ]; then
                print_success "Anthropic text generation: OK"
                return 0
            else
                print_error "Anthropic text generation: FAILED"
                if [ "$VERBOSE" = true ]; then
                    echo "Response: $response"
                fi
                return 1
            fi
            ;;
        analysis)
            print_test "Testing text analysis..."
            # Anthropic doesn't have a dedicated embedding API, so we'll test with a different approach
            local payload='{
                "model": "'$MODEL'",
                "max_tokens": 50,
                "messages": [{"role": "user", "content": "Analyze this text: \"Hello world\""}]
            }'
            
            if curl -s --max-time "$TIMEOUT" -H "$headers" -H "$anthropic_version" -H "Content-Type: application/json" -d "$payload" "$api_url" | jq -e '.content[0].text' &> /dev/null; then
                print_success "Anthropic text analysis: OK"
                return 0
            else
                print_error "Anthropic text analysis: FAILED"
                return 1
            fi
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            return 1
            ;;
    esac
}

# Test Gemini provider
test_gemini() {
    print_provider "Testing Gemini..."
    
    if [ -z "$API_KEY" ]; then
        print_error "Gemini API key not found"
        return 1
    fi
    
    local api_url="https://generativelanguage.googleapis.com/v1beta/models"
    local headers="x-goog-api-key: $API_KEY"
    
    case "$TEST_TYPE" in
        connectivity)
            print_test "Testing API connectivity..."
            if curl -s --max-time "$TIMEOUT" -H "$headers" "$api_url" | jq -e '.models' &> /dev/null; then
                print_success "Gemini API connectivity: OK"
                return 0
            else
                print_error "Gemini API connectivity: FAILED"
                return 1
            fi
            ;;
        generation)
            print_test "Testing text generation..."
            api_url="https://generativelanguage.googleapis.com/v1beta/models/$MODEL:generateContent"
            local payload='{
                "contents": [{"parts": [{"text": "Hello, respond with just \"OK\"}]}],
                "generationConfig": {"maxOutputTokens": 10}
            }'
            
            local response=$(curl -s --max-time "$TIMEOUT" -H "$headers" -H "Content-Type: application/json" -d "$payload" "$api_url")
            local content=$(echo "$response" | jq -r '.candidates[0].content.parts[0].text' 2>/dev/null || echo "")
            
            if [ "$content" = "OK" ] || [ "$content" = "\"OK\"" ]; then
                print_success "Gemini text generation: OK"
                return 0
            else
                print_error "Gemini text generation: FAILED"
                if [ "$VERBOSE" = true ]; then
                    echo "Response: $response"
                fi
                return 1
            fi
            ;;
        analysis)
            print_test "Testing text analysis..."
            api_url="https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent"
            local payload='{
                "content": {"parts": [{"text": "test text for embedding"}]}
            }'
            
            if curl -s --max-time "$TIMEOUT" -H "$headers" -H "Content-Type: application/json" -d "$payload" "$api_url" | jq -e '.embedding.values' &> /dev/null; then
                print_success "Gemini text analysis: OK"
                return 0
            else
                print_error "Gemini text analysis: FAILED"
                return 1
            fi
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            return 1
            ;;
    esac
}

# Test all providers
test_all_providers() {
    print_status "Testing all configured AI providers..."
    
    local providers=("openai" "anthropic" "gemini" "groq" "cohere" "openrouter" "zhipu" "together")
    local results=()
    
    for provider in "${providers[@]}"; do
        print_status "Testing provider: $provider"
        
        # Save current provider and API key
        local current_provider="$PROVIDER"
        local current_api_key="$API_KEY"
        
        # Set provider-specific variables
        PROVIDER="$provider"
        case "$provider" in
            openai)
                API_KEY="${OPENAI_API_KEY:-}"
                ;;
            anthropic)
                API_KEY="${ANTHROPIC_API_KEY:-}"
                ;;
            gemini)
                API_KEY="${GEMINI_API_KEY:-}"
                ;;
            groq)
                API_KEY="${GROQ_API_KEY:-}"
                ;;
            cohere)
                API_KEY="${COHERE_API_KEY:-}"
                ;;
            openrouter)
                API_KEY="${OPENROUTER_API_KEY:-}"
                ;;
            zhipu)
                API_KEY="${ZHIPU_API_KEY:-}"
                ;;
            together)
                API_KEY="${TOGETHER_API_KEY:-}"
                ;;
        esac
        
        # Test connectivity
        if test_provider_connectivity "$provider"; then
            results+=("$provider: PASS")
        else
            results+=("$provider: FAIL")
        fi
        
        # Restore original values
        PROVIDER="$current_provider"
        API_KEY="$current_api_key"
    done
    
    # Display results
    echo ""
    print_status "Test Results Summary:"
    for result in "${results[@]}"; do
        echo "  $result"
    done
}

# Test provider connectivity
test_provider_connectivity() {
    case "$PROVIDER" in
        openai)
            test_openai
            ;;
        anthropic)
            test_anthropic
            ;;
        gemini)
            test_gemini
            ;;
        groq|cohere|openrouter|zhipu|together)
            # For other providers, implement similar test functions
            print_warning "Test for $PROVIDER not implemented yet"
            return 1
            ;;
        *)
            print_error "Unknown provider: $PROVIDER"
            return 1
            ;;
    esac
}

# Format output
format_output() {
    local provider="$1"
    local result="$2"
    local details="$3"
    
    case "$OUTPUT_FORMAT" in
        json)
            echo "{\"provider\":\"$provider\",\"result\":\"$result\",\"details\":\"$details\",\"timestamp\":\"$(date -Iseconds)\"}"
            ;;
        csv)
            echo "\"$provider\",\"$result\",\"$details\",\"$(date -Iseconds)\""
            ;;
        table|*)
            printf "%-15s | %-6s | %s\n" "$provider" "$result" "$details"
            ;;
    esac
}

# Main test function
main() {
    print_status "Starting AI providers test..."
    print_status "Test type: $TEST_TYPE"
    print_status "Timeout: ${TIMEOUT}s"
    
    # Load environment
    load_environment
    
    # Check tools
    check_tools
    
    # Print header for table format
    if [ "$OUTPUT_FORMAT" = "table" ]; then
        printf "%-15s | %-6s | %s\n" "Provider" "Result" "Details"
        printf "%-15s-+-%-6s-+-%s\n" "---------------" "------" "------------------"
    fi
    
    # Run tests
    if [ "$PROVIDER" = "all" ]; then
        test_all_providers
    elif [ -n "$PROVIDER" ]; then
        if test_provider_connectivity "$PROVIDER"; then
            format_output "$PROVIDER" "PASS" "Test completed successfully"
        else
            format_output "$PROVIDER" "FAIL" "Test failed"
        fi
    else
        print_error "No provider specified. Use --provider or --all"
        exit 1
    fi
    
    print_success "AI providers test completed!"
}

# Handle script interruption
trap 'print_error "Test interrupted."' INT

# Run main function
main "$@"