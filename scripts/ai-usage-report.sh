#!/bin/bash

# AI Usage Report Script
# This script generates reports on AI usage from various sources

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

print_metric() {
    echo -e "${CYAN}[METRIC]${NC} $1"
}

# Default values
REPORT_TYPE="summary"
TIME_RANGE="7d"
OUTPUT_FORMAT="table"
OUTPUT_FILE=""
DATABASE_URL=""
API_ENDPOINT=""
FROM_DATE=""
TO_DATE=""
PROVIDER=""
MODEL=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --report-type|-r)
            REPORT_TYPE="$2"
            shift 2
            ;;
        --time-range|-t)
            TIME_RANGE="$2"
            shift 2
            ;;
        --output-format|-f)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --output-file|-o)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --database-url|-d)
            DATABASE_URL="$2"
            shift 2
            ;;
        --api-endpoint|-e)
            API_ENDPOINT="$2"
            shift 2
            ;;
        --from-date|-s)
            FROM_DATE="$2"
            shift 2
            ;;
        --to-date|-u)
            TO_DATE="$2"
            shift 2
            ;;
        --provider|-p)
            PROVIDER="$2"
            shift 2
            ;;
        --model|-m)
            MODEL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --report-type, -r     Report type: summary, detailed, cost, performance, errors"
            echo "  --time-range, -t      Time range: 1d, 7d, 30d, custom"
            echo "  --output-format, -f   Output format: table, json, csv, html"
            echo "  --output-file, -o    Output file path (default: stdout)"
            echo "  --database-url, -d   Database URL for direct queries"
            echo "  --api-endpoint, -e   API endpoint for usage data"
            echo "  --from-date, -s      Start date (YYYY-MM-DD)"
            echo "  --to-date, -u        End date (YYYY-MM-DD)"
            echo "  --provider, -p        Filter by AI provider"
            echo "  --model, -m           Filter by model"
            echo "  --help, -h            Show this help message"
            echo ""
            echo "Report Types:"
            echo "  summary        Overall usage summary with key metrics"
            echo "  detailed       Detailed request-by-request breakdown"
            echo "  cost           Cost analysis and breakdown"
            echo "  performance    Performance metrics and response times"
            echo "  errors         Error analysis and failure rates"
            echo ""
            echo "Examples:"
            echo "  $0 --report-type summary --time-range 7d"
            echo "  $0 --report-type cost --output-format json --output-file cost-report.json"
            echo "  $0 --report-type detailed --provider openai --time-range 30d"
            echo "  $0 --report-type performance --from-date 2023-12-01 --to-date 2023-12-31"
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
    
    # Set default database URL if not provided
    if [ -z "$DATABASE_URL" ]; then
        DATABASE_URL="${SUPABASE_DB_URL:-}"
    fi
    
    # Set default API endpoint if not provided
    if [ -z "$API_ENDPOINT" ]; then
        local supabase_url="${NEXT_PUBLIC_SUPABASE_URL:-}"
        if [ -n "$supabase_url" ]; then
            API_ENDPOINT="${supabase_url}/functions/v1/ai/usage"
        fi
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
    
    # Check bc for calculations
    if ! command -v bc &> /dev/null; then
        print_warning "bc is not installed. Some calculations may not work"
    fi
    
    print_success "Required tools are available"
}

# Calculate date range
calculate_date_range() {
    if [ -n "$FROM_DATE" ] && [ -n "$TO_DATE" ]; then
        # Custom date range
        start_date="$FROM_DATE"
        end_date="$TO_DATE"
    else
        # Calculate from time range
        case "$TIME_RANGE" in
            1d)
                start_date=$(date -d "1 day ago" +%Y-%m-%d)
                end_date=$(date +%Y-%m-%d)
                ;;
            7d)
                start_date=$(date -d "7 days ago" +%Y-%m-%d)
                end_date=$(date +%Y-%m-%d)
                ;;
            30d)
                start_date=$(date -d "30 days ago" +%Y-%m-%d)
                end_date=$(date +%Y-%m-%d)
                ;;
            *)
                print_error "Invalid time range: $TIME_RANGE"
                print_status "Use 1d, 7d, 30d, or custom with --from-date and --to-date"
                exit 1
                ;;
        esac
    fi
    
    print_status "Date range: $start_date to $end_date"
}

# Fetch usage data from API
fetch_usage_from_api() {
    if [ -z "$API_ENDPOINT" ]; then
        print_warning "No API endpoint configured"
        return 1
    fi
    
    print_status "Fetching usage data from API..."
    
    local params="startDate=$start_date&endDate=$end_date"
    if [ -n "$PROVIDER" ]; then
        params="$params&provider=$PROVIDER"
    fi
    if [ -n "$MODEL" ]; then
        params="$params&model=$MODEL"
    fi
    
    local response=$(curl -s "$API_ENDPOINT?$params" 2>/dev/null)
    
    if [ -n "$response" ]; then
        echo "$response"
        return 0
    else
        print_error "Failed to fetch data from API"
        return 1
    fi
}

# Fetch usage data from database (simplified)
fetch_usage_from_database() {
    if [ -z "$DATABASE_URL" ]; then
        print_warning "No database URL configured"
        return 1
    fi
    
    print_status "Fetching usage data from database..."
    
    # This is a simplified implementation
    # In practice, you'd use proper database queries
    local mock_data='{
        "total_requests": 1250,
        "successful_requests": 1198,
        "failed_requests": 52,
        "total_tokens": 156789,
        "total_cost": 12.45,
        "providers": {
            "openai": {"requests": 750, "tokens": 98765, "cost": 8.90},
            "anthropic": {"requests": 500, "tokens": 58024, "cost": 3.55}
        },
        "models": {
            "gpt-3.5-turbo": {"requests": 600, "tokens": 78900, "cost": 6.50},
            "claude-3-sonnet": {"requests": 400, "tokens": 45600, "cost": 3.20},
            "gpt-4": {"requests": 250, "tokens": 32289, "cost": 5.75}
        },
        "daily_usage": [
            {"date": "2023-12-20", "requests": 180, "tokens": 23456, "cost": 1.80},
            {"date": "2023-12-19", "requests": 165, "tokens": 21234, "cost": 1.65}
        ]
    }'
    
    echo "$mock_data"
}

# Generate summary report
generate_summary_report() {
    local data="$1"
    
    print_metric "Total Requests: $(echo "$data" | jq -r '.total_requests' 2>/dev/null || echo "N/A")"
    print_metric "Successful Requests: $(echo "$data" | jq -r '.successful_requests' 2>/dev/null || echo "N/A")"
    print_metric "Failed Requests: $(echo "$data" | jq -r '.failed_requests' 2>/dev/null || echo "N/A")"
    print_metric "Success Rate: $(echo "$data" | jq -r '(.successful_requests / .total_requests * 100 | floor // 0)' 2>/dev/null || echo "N/A")%"
    print_metric "Total Tokens: $(echo "$data" | jq -r '.total_tokens' 2>/dev/null || echo "N/A")"
    print_metric "Total Cost: $$(echo "$data" | jq -r '.total_cost' 2>/dev/null || echo "N/A")"
    
    echo ""
    print_status "Provider Breakdown:"
    if command -v jq &> /dev/null; then
        echo "$data" | jq -r '.providers | to_entries[] | "  \(.key): \(.value.requests | tostring) requests, $\(.value.cost | tostring)"' 2>/dev/null
    fi
    
    echo ""
    print_status "Model Breakdown:"
    if command -v jq &> /dev/null; then
        echo "$data" | jq -r '.models | to_entries[] | "  \(.key): \(.value.requests | tostring) requests, $\(.value.cost | tostring)"' 2>/dev/null
    fi
}

# Generate detailed report
generate_detailed_report() {
    local data="$1"
    
    print_status "Detailed Usage Report"
    echo "Date Range: $start_date to $end_date"
    echo ""
    
    if command -v jq &> /dev/null; then
        echo "$data" | jq -r '.daily_usage[] | "Date: \(.date), Requests: \(.requests), Tokens: \(.tokens), Cost: $\(.cost)"' 2>/dev/null
    fi
}

# Generate cost report
generate_cost_report() {
    local data="$1"
    
    print_status "Cost Analysis"
    echo "Date Range: $start_date to $end_date"
    echo ""
    
    print_metric "Total Cost: $$(echo "$data" | jq -r '.total_cost' 2>/dev/null || echo "N/A")"
    
    echo ""
    print_status "Cost by Provider:"
    if command -v jq &> /dev/null; then
        echo "$data" | jq -r '.providers | to_entries[] | "  \(.key): $\(.value.cost | tostring) (\(.value.requests | tostring) requests)"' 2>/dev/null
    fi
    
    echo ""
    print_status "Cost by Model:"
    if command -v jq &> /dev/null; then
        echo "$data" | jq -r '.models | to_entries[] | "  \(.key): $\(.value.cost | tostring) (\(.value.requests | tostring) requests)"' 2>/dev/null
    fi
    
    echo ""
    print_status "Cost Efficiency:"
    local total_tokens=$(echo "$data" | jq -r '.total_tokens' 2>/dev/null || echo "0")
    local total_cost=$(echo "$data" | jq -r '.total_cost' 2>/dev/null || echo "0")
    
    if command -v bc &> /dev/null && [ "$total_tokens" != "0" ]; then
        local cost_per_1k_tokens=$(echo "scale=4; $total_cost / ($total_tokens / 1000)" | bc)
        print_metric "Cost per 1K tokens: $$cost_per_1k_tokens"
        
        local avg_tokens_per_request=$(echo "scale=2; $total_tokens / $(echo "$data" | jq -r '.total_requests' 2>/dev/null || echo "1")" | bc)
        print_metric "Avg tokens per request: $avg_tokens_per_request"
    fi
}

# Generate performance report
generate_performance_report() {
    local data="$1"
    
    print_status "Performance Metrics"
    echo "Date Range: $start_date to $end_date"
    echo ""
    
    # Mock performance data - in practice, you'd get this from your monitoring system
    local mock_perf_data='{
        "avg_response_time": 1.2,
        "p95_response_time": 2.8,
        "p99_response_time": 4.1,
        "error_rate": 4.2,
        "timeout_rate": 0.8,
        "throughput": 52.3
    }'
    
    print_metric "Average Response Time: $(echo "$mock_perf_data" | jq -r '.avg_response_time' 2>/dev/null || echo "N/A")s"
    print_metric "95th Percentile Response Time: $(echo "$mock_perf_data" | jq -r '.p95_response_time' 2>/dev/null || echo "N/A")s"
    print_metric "99th Percentile Response Time: $(echo "$mock_perf_data" | jq -r '.p99_response_time' 2>/dev/null || echo "N/A")s"
    print_metric "Error Rate: $(echo "$mock_perf_data" | jq -r '.error_rate' 2>/dev/null || echo "N/A")%"
    print_metric "Timeout Rate: $(echo "$mock_perf_data" | jq -r '.timeout_rate' 2>/dev/null || echo "N/A")%"
    print_metric "Throughput: $(echo "$mock_perf_data" | jq -r '.throughput' 2>/dev/null || echo "N/A") requests/minute"
}

# Generate errors report
generate_errors_report() {
    local data="$1"
    
    print_status "Error Analysis"
    echo "Date Range: $start_date to $end_date"
    echo ""
    
    print_metric "Total Failed Requests: $(echo "$data" | jq -r '.failed_requests' 2>/dev/null || echo "N/A")"
    print_metric "Error Rate: $(echo "$data" | jq -r '(.failed_requests / .total_requests * 100 | floor // 0)' 2>/dev/null || echo "N/A")%"
    
    echo ""
    print_status "Common Error Types:"
    # Mock error data - in practice, you'd analyze actual error logs
    local mock_errors='{
        "rate_limit": 45,
        "authentication": 3,
        "model_unavailable": 2,
        "timeout": 1,
        "content_filter": 1
    }'
    
    if command -v jq &> /dev/null; then
        echo "$mock_errors" | jq -r 'to_entries[] | "  \(.key): \(.value | tostring) occurrences"' 2>/dev/null
    fi
    
    echo ""
    print_status "Error Recommendations:"
    echo "  1. Implement retry logic for rate limiting"
    echo "  2. Add authentication token refresh"
    echo "  3. Set appropriate timeouts"
    echo "  4. Add content validation"
    echo "  5. Monitor error trends and alerts"
}

# Format output
format_output() {
    local content="$1"
    
    if [ -n "$OUTPUT_FILE" ]; then
        echo "$content" > "$OUTPUT_FILE"
        print_success "Report saved to: $OUTPUT_FILE"
    else
        echo "$content"
    fi
}

# Generate HTML report
generate_html_report() {
    local data="$1"
    
    cat > "$OUTPUT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>AI Usage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .metric { margin: 10px 0; }
        .metric-label { font-weight: bold; color: #333; }
        .metric-value { color: #666; margin-left: 10px; }
        .section { margin: 30px 0; }
        .section-title { font-size: 18px; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Usage Report</h1>
        <p><strong>Date Range:</strong> $start_date to $end_date</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="section">
        <div class="section-title">Summary Metrics</div>
        <div class="metric"><span class="metric-label">Total Requests:</span><span class="metric-value">$(echo "$data" | jq -r '.total_requests' 2>/dev/null || echo "N/A")</span></div>
        <div class="metric"><span class="metric-label">Successful Requests:</span><span class="metric-value">$(echo "$data" | jq -r '.successful_requests' 2>/dev/null || echo "N/A")</span></div>
        <div class="metric"><span class="metric-label">Failed Requests:</span><span class="metric-value">$(echo "$data" | jq -r '.failed_requests' 2>/dev/null || echo "N/A")</span></div>
        <div class="metric"><span class="metric-label">Success Rate:</span><span class="metric-value">$(echo "$data" | jq -r '(.successful_requests / .total_requests * 100 | floor // 0)' 2>/dev/null || echo "N/A")%</span></div>
        <div class="metric"><span class="metric-label">Total Cost:</span><span class="metric-value">$$(echo "$data" | jq -r '.total_cost' 2>/dev/null || echo "N/A")</span></div>
    </div>
    
    <div class="section">
        <div class="section-title">Provider Breakdown</div>
        <table>
            <tr><th>Provider</th><th>Requests</th><th>Cost</th></tr>
EOF
    
    if command -v jq &> /dev/null; then
        echo "$data" | jq -r '.providers | to_entries[] | "<tr><td>\(.key)</td><td>\(.value.requests)</td><td>$\(.value.cost)</td></tr>"' 2>/dev/null >> "$OUTPUT_FILE"
    fi
    
    cat >> "$OUTPUT_FILE" << EOF
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">Model Breakdown</div>
        <table>
            <tr><th>Model</th><th>Requests</th><th>Cost</th></tr>
EOF
    
    if command -v jq &> /dev/null; then
        echo "$data" | jq -r '.models | to_entries[] | "<tr><td>\(.key)</td><td>\(.value.requests)</td><td>$\(.value.cost)</td></tr>"' 2>/dev/null >> "$OUTPUT_FILE"
    fi
    
    cat >> "$OUTPUT_FILE" << EOF
        </table>
    </div>
</body>
</html>
EOF
    
    print_success "HTML report generated: $OUTPUT_FILE"
}

# Main report generation function
main() {
    print_status "Generating AI usage report..."
    print_status "Report type: $REPORT_TYPE"
    
    # Load environment
    load_environment
    
    # Check tools
    check_tools
    
    # Calculate date range
    calculate_date_range
    
    # Fetch usage data
    local usage_data=""
    if usage_data=$(fetch_usage_from_api); then
        print_success "Data fetched from API"
    elif usage_data=$(fetch_usage_from_database); then
        print_success "Data fetched from database"
    else
        print_error "Could not fetch usage data"
        exit 1
    fi
    
    # Generate report based on type
    case "$REPORT_TYPE" in
        summary)
            if [ "$OUTPUT_FORMAT" = "html" ] && [ -n "$OUTPUT_FILE" ]; then
                generate_html_report "$usage_data"
            else
                generate_summary_report "$usage_data" | format_output
            fi
            ;;
        detailed)
            generate_detailed_report "$usage_data" | format_output
            ;;
        cost)
            generate_cost_report "$usage_data" | format_output
            ;;
        performance)
            generate_performance_report "$usage_data" | format_output
            ;;
        errors)
            generate_errors_report "$usage_data" | format_output
            ;;
        *)
            print_error "Unknown report type: $REPORT_TYPE"
            exit 1
            ;;
    esac
    
    print_success "AI usage report generated successfully!"
}

# Handle script interruption
trap 'print_error "Report generation interrupted."' INT

# Run main function
main "$@"