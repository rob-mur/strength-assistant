#!/bin/bash
# T023: Workflow monitoring script for deployment status
# Monitor the unified production deployment workflow

set -e

WORKFLOW_NAME="Production Deployment"
WORKFLOW_FILE="production-deployment.yml"

echo "📊 Production Deployment Monitor"
echo "================================"

# Function to display workflow run status
show_run_status() {
    local run_id=$1
    local status=$(gh run view "$run_id" --json status --jq '.status')
    local conclusion=$(gh run view "$run_id" --json conclusion --jq '.conclusion')
    local created_at=$(gh run view "$run_id" --json createdAt --jq '.createdAt')
    local commit_sha=$(gh run view "$run_id" --json headSha --jq '.headSha')
    
    echo "🔗 Run ID: $run_id"
    echo "📅 Started: $created_at"
    echo "📦 Commit: ${commit_sha:0:8}"
    echo "📊 Status: $status"
    
    if [ "$conclusion" != "null" ]; then
        case "$conclusion" in
            "success")
                echo "✅ Result: SUCCESS"
                ;;
            "failure")
                echo "❌ Result: FAILED"
                ;;
            "cancelled")
                echo "🚫 Result: CANCELLED"
                ;;
            *)
                echo "⚠️  Result: $conclusion"
                ;;
        esac
    fi
    echo ""
}

# Function to show job details
show_job_details() {
    local run_id=$1
    echo "📋 Job Details:"
    gh run view "$run_id" --json jobs --jq '.jobs[] | "  \(.name): \(.status) -> \(.conclusion // "running")"'
    echo ""
}

# Check if workflow exists
if ! gh workflow list | grep -q "$WORKFLOW_NAME"; then
    echo "❌ Workflow '$WORKFLOW_NAME' not found"
    echo "Available workflows:"
    gh workflow list
    exit 1
fi

# Show recent runs
echo "📈 Recent Production Deployment Runs:"
echo "====================================="

RUNS=$(gh run list --workflow="$WORKFLOW_FILE" --limit=5 --json databaseId --jq '.[].databaseId')

if [ -z "$RUNS" ]; then
    echo "No recent runs found for $WORKFLOW_NAME"
    exit 0
fi

for run_id in $RUNS; do
    show_run_status "$run_id"
done

# Show details for the latest run
LATEST_RUN=$(echo "$RUNS" | head -1)
echo "🔍 Latest Run Details:"
echo "====================="
show_job_details "$LATEST_RUN"

# Show workflow definition status
echo "📄 Workflow Configuration:"
echo "=========================="
echo "📁 File: .github/workflows/$WORKFLOW_FILE"

if [ -f ".github/workflows/$WORKFLOW_FILE" ]; then
    echo "✅ Workflow file exists"
    
    # Check for key configuration
    if grep -q "concurrency:" ".github/workflows/$WORKFLOW_FILE"; then
        echo "✅ Concurrency control configured"
    else
        echo "⚠️  No concurrency control found"
    fi
    
    if grep -q "build_production.apk" ".github/workflows/$WORKFLOW_FILE"; then
        echo "✅ Correct APK naming (build_production.apk)"
    else
        echo "❌ APK naming issue detected"
    fi
    
    if grep -q "needs:" ".github/workflows/$WORKFLOW_FILE"; then
        echo "✅ Job dependencies configured"
    else
        echo "⚠️  No job dependencies found"
    fi
else
    echo "❌ Workflow file not found"
fi

echo ""
echo "🛠️  Monitoring Commands:"
echo "======================="
echo "Watch latest run:     gh run watch"
echo "View logs:            gh run view $LATEST_RUN --log"
echo "Cancel latest run:    gh run cancel $LATEST_RUN"
echo "Trigger manual run:   gh workflow run '$WORKFLOW_NAME'"

# Optional: Real-time monitoring
if [ "$1" = "--watch" ]; then
    echo ""
    echo "🔄 Watching for new deployments (Ctrl+C to stop)..."
    echo "=================================================="
    
    LAST_CHECK=$(date +%s)
    
    while true; do
        sleep 30
        
        # Check for new runs
        NEW_RUNS=$(gh run list --workflow="$WORKFLOW_FILE" --limit=1 --json createdAt,databaseId,status --jq '.[] | select(.createdAt > "'"$(date -d "@$LAST_CHECK" -Iseconds)"'") | .databaseId')
        
        if [ -n "$NEW_RUNS" ]; then
            echo "🆕 New deployment detected!"
            for run_id in $NEW_RUNS; do
                show_run_status "$run_id"
            done
        fi
        
        LAST_CHECK=$(date +%s)
    done
fi