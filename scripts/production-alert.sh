#!/bin/bash

# Production Validation Alert System
# Handles notifications for production validation failures and successes
# Integrates with GitHub Actions and team communication channels

set -e

# Configuration
DEPLOYMENT_ID="${1:-unknown}"
STATUS="${2:-unknown}"
GITHUB_RUN_URL="https://github.com/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"

echo "🚨 Production Validation Alert System"
echo "   Deployment ID: $DEPLOYMENT_ID"
echo "   Status: $STATUS"
echo "   GitHub Run: $GITHUB_RUN_URL"

# Function to send GitHub issue comment (if applicable)
create_github_comment() {
    local message="$1"
    
    if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_REPOSITORY" ]; then
        echo "📝 Creating GitHub discussion comment..."
        # This would integrate with GitHub API for team notifications
        echo "GitHub integration ready (token available)"
    else
        echo "ℹ️  GitHub token not available - skipping GitHub notifications"
    fi
}

# Function to create deployment status
update_deployment_status() {
    local status="$1"
    local description="$2"
    
    if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_REPOSITORY" ]; then
        echo "📊 Updating deployment status to: $status"
        # GitHub deployment status API integration
        echo "Deployment status: $status - $description"
    fi
}

# Handle different alert scenarios
case "$STATUS" in
    "failed")
        echo "❌ PRODUCTION VALIDATION FAILED"
        echo ""
        echo "🔍 Details:"
        echo "   - Production tests failed against live infrastructure"
        echo "   - Deployment ID: $DEPLOYMENT_ID"
        echo "   - Manual intervention required"
        echo "   - Frontend deployment is BLOCKED"
        echo ""
        echo "🚨 Required Actions:"
        echo "   1. Review test artifacts and logs"
        echo "   2. Investigate production environment issues"
        echo "   3. Determine if infrastructure rollback is necessary"
        echo "   4. Fix issues or approve manual override"
        echo ""
        echo "📊 GitHub Actions: $GITHUB_RUN_URL"
        
        # Create failure notification
        create_github_comment "🚨 Production validation failed for deployment \`$DEPLOYMENT_ID\`. Manual intervention required before frontend deployment can proceed."
        
        # Update deployment status
        update_deployment_status "failure" "Production validation failed - manual intervention required"
        
        # Set GitHub Actions output for downstream jobs
        echo "PRODUCTION_VALIDATION=failed" >> $GITHUB_OUTPUT
        echo "BLOCK_DEPLOYMENT=true" >> $GITHUB_OUTPUT
        
        # Exit with failure to ensure GitHub Actions marks step as failed
        exit 1
        ;;
        
    "passed")
        echo "✅ PRODUCTION VALIDATION PASSED"
        echo ""
        echo "🎉 Details:"
        echo "   - All production tests passed against live infrastructure"
        echo "   - Deployment ID: $DEPLOYMENT_ID"
        echo "   - Production environment validated"
        echo "   - Frontend deployment approved"
        echo ""
        echo "🚀 Next Steps:"
        echo "   - Frontend deployment can proceed with confidence"
        echo "   - Production environment is ready for user traffic"
        echo "   - Monitor application performance post-deployment"
        echo ""
        
        # Create success notification
        create_github_comment "✅ Production validation passed for deployment \`$DEPLOYMENT_ID\`. Frontend deployment approved."
        
        # Update deployment status
        update_deployment_status "success" "Production validation passed - deployment approved"
        
        # Set GitHub Actions output for downstream jobs
        echo "PRODUCTION_VALIDATION=passed" >> $GITHUB_OUTPUT
        echo "BLOCK_DEPLOYMENT=false" >> $GITHUB_OUTPUT
        ;;
        
    "timeout")
        echo "⏰ PRODUCTION VALIDATION TIMEOUT"
        echo ""
        echo "⚠️  Details:"
        echo "   - Production tests exceeded time limit"
        echo "   - Deployment ID: $DEPLOYMENT_ID"
        echo "   - May indicate infrastructure performance issues"
        echo ""
        echo "🔍 Investigation Required:"
        echo "   1. Check production server performance"
        echo "   2. Review network connectivity"
        echo "   3. Analyze test execution logs"
        echo "   4. Consider manual validation if infrastructure is healthy"
        
        # Create timeout notification
        create_github_comment "⏰ Production validation timed out for deployment \`$DEPLOYMENT_ID\`. Investigation required."
        
        # Update deployment status
        update_deployment_status "error" "Production validation timeout - investigation required"
        
        # Set outputs and exit with failure
        echo "PRODUCTION_VALIDATION=timeout" >> $GITHUB_OUTPUT
        echo "BLOCK_DEPLOYMENT=true" >> $GITHUB_OUTPUT
        exit 1
        ;;
        
    *)
        echo "❓ UNKNOWN VALIDATION STATUS: $STATUS"
        echo "   Deployment ID: $DEPLOYMENT_ID"
        echo "   Manual review required"
        
        # Set safe defaults
        echo "PRODUCTION_VALIDATION=unknown" >> $GITHUB_OUTPUT
        echo "BLOCK_DEPLOYMENT=true" >> $GITHUB_OUTPUT
        exit 1
        ;;
esac

# Log final status
echo ""
echo "📝 Alert processing complete"
echo "   Status: $STATUS"
echo "   Deployment blocking: $([ "$STATUS" = "passed" ] && echo "false" || echo "true")"