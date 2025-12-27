# VistralAI Operations & Management Guide

**Comprehensive guide for managing, monitoring, and maintaining VistralAI production deployment.**

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring & Observability](#monitoring--observability)
3. [Scaling & Performance](#scaling--performance)
4. [Backup & Disaster Recovery](#backup--disaster-recovery)
5. [Cost Management](#cost-management)
6. [Incident Response](#incident-response)
7. [Security Management](#security-management)
8. [Updates & Maintenance](#updates--maintenance)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Useful Commands](#useful-commands)

---

## Daily Operations

### Morning Checklist

Run every morning (or set up automated health checks):

```bash
#!/bin/bash
# health-check.sh

PROJECT_ID=vistralai
REGION=us-central1
SERVICE_NAME=vistralai
FIRECRAWL_SERVICE=firecrawl-service
REDIS_INSTANCE=vistralai-redis

echo "=== VistralAI Daily Health Check ==="
echo ""

# 1. Check VistralAI service status
echo "1. VistralAI Service Status:"
SERVICE_STATUS=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(status.conditions[0].status)')

if [ "$SERVICE_STATUS" = "True" ]; then
  echo "   ✓ VistralAI is running"
else
  echo "   ✗ VistralAI status: $SERVICE_STATUS"
fi

# 2. Check Firecrawl service
echo "2. Firecrawl Service Status:"
FIRECRAWL_STATUS=$(gcloud run services describe $FIRECRAWL_SERVICE \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(status.conditions[0].status)' 2>/dev/null || echo "Unknown")

if [ "$FIRECRAWL_STATUS" = "True" ]; then
  echo "   ✓ Firecrawl is running"
else
  echo "   ✗ Firecrawl status: $FIRECRAWL_STATUS"
fi

# 3. Check Redis instance
echo "3. Redis Instance Status:"
REDIS_STATE=$(gcloud redis instances describe $REDIS_INSTANCE \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(state)')

if [ "$REDIS_STATE" = "READY" ]; then
  echo "   ✓ Redis is ready"
else
  echo "   ✗ Redis state: $REDIS_STATE"
fi

# 4. Check recent errors
echo "4. Recent Errors (last 1 hour):"
ERROR_COUNT=$(gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR AND timestamp>=\"$(date -u -d '1 hour ago' +'%Y-%m-%dT%H:%M:%SZ')\" AND resource.labels.service_name=$SERVICE_NAME" \
  --project=$PROJECT_ID \
  --format='value(severity)' | wc -l)

if [ "$ERROR_COUNT" -eq 0 ]; then
  echo "   ✓ No errors found"
else
  echo "   ✗ Found $ERROR_COUNT errors"
fi

echo ""
echo "=== Health Check Complete ==="
```

### Hourly Monitoring (Automated)

Set up Cloud Monitoring to track:

- Request rate (should be smooth, no sudden spikes)
- Error rate (should be <1%)
- Response latency (p50 <200ms, p95 <500ms)
- CPU usage (should be <70%)
- Memory usage (should be <80%)

### Weekly Review

Every Monday morning, review:

1. **Performance Metrics**
   - Average response time trends
   - Peak load patterns
   - Error rate trends

2. **Cost Analysis**
   - Cloud Run costs
   - Redis costs
   - API costs (Claude, Firecrawl)
   - Total weekly spend

3. **Capacity Planning**
   - Are we approaching resource limits?
   - Do we need to adjust scaling parameters?
   - Any performance degradation?

4. **Security**
   - Check for any unauthorized access attempts
   - Review audit logs
   - Verify secrets rotation schedule

---

## Monitoring & Observability

### Cloud Monitoring Dashboards

#### Dashboard 1: Service Health

View at: https://console.cloud.google.com/monitoring/dashboards

Key metrics to track:

```
VistralAI Health Dashboard:
├── Request Count (last 24h)
├── Error Rate (%)
├── P50 Latency (ms)
├── P95 Latency (ms)
├── Memory Usage (%)
├── CPU Usage (%)
├── Active Instances
└── Network In/Out
```

#### Dashboard 2: Dependencies

```
Infrastructure Dependencies:
├── Redis Memory Usage (%)
├── Redis Connection Count
├── Firecrawl Request Count
├── Firecrawl Error Rate (%)
├── Firecrawl Latency (ms)
└── VPC Connector Status
```

#### Dashboard 3: Cost Tracking

```
Monthly Cost Analysis:
├── Cloud Run (compute)
├── Cloud Run (requests)
├── Redis (Memorystore)
├── Storage
├── Network egress
└── Total Projected Cost
```

### Cloud Logging

#### View Recent Logs

```bash
# View last 50 log entries
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=vistralai" \
  --limit=50 \
  --format=json \
  --project=vistralai | jq .

# View errors only
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR AND resource.labels.service_name=vistralai" \
  --limit=50 \
  --format=json \
  --project=vistralai

# View warnings
gcloud logging read "resource.type=cloud_run_revision AND severity=WARNING AND resource.labels.service_name=vistralai" \
  --limit=50 \
  --format=json \
  --project=vistralai
```

#### Create Log Sink for Error Tracking

```bash
# Send ERROR logs to Sentry or other error tracking service
gcloud logging sinks create vistralai-errors \
  https://your-sentry-endpoint/api/1234567/store/ \
  --log-filter='resource.type=cloud_run_revision AND severity=ERROR AND resource.labels.service_name=vistralai' \
  --project=vistralai
```

#### Create Alerts

```bash
# High Error Rate Alert (>1%)
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="VistralAI High Error Rate" \
  --condition-display-name="Error rate > 1% (5 min)" \
  --condition-threshold-value=0.01 \
  --condition-threshold-duration=300s \
  --project=vistralai

# High Latency Alert (>5 seconds)
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="VistralAI High Latency" \
  --condition-display-name="P95 latency > 5000ms" \
  --condition-threshold-value=5000 \
  --condition-threshold-duration=300s \
  --project=vistralai
```

---

## Scaling & Performance

### Understanding Auto-Scaling

VistralAI uses Cloud Run's auto-scaling:

```yaml
Min instances: 0    # Scales down to zero when idle
Max instances: 20   # Won't exceed 20 concurrent instances
CPU target: 70%     # Scales up when avg CPU > 70%
Memory: 2Gi         # Per instance
Timeout: 3600s      # 1 hour max request time
```

### Monitoring Scaling Behavior

```bash
# Watch instance count in real-time
watch -n 2 'gcloud run services describe vistralai \
  --region=us-central1 \
  --project=vistralai \
  --format="table(status.conditions[0].message)"'

# Check revision details (instance info)
gcloud run revisions list \
  --service=vistralai \
  --region=us-central1 \
  --project=vistralai \
  --format="table(name, spec.containers[0].resources.limits.memory, status.conditions[0].status)"
```

### Adjusting Scaling Parameters

If you need more instances:

```bash
# Increase max instances to 50
gcloud run services update vistralai \
  --max-instances=50 \
  --region=us-central1 \
  --project=vistralai

# Increase min instances to 1 (always warm)
gcloud run services update vistralai \
  --min-instances=1 \
  --region=us-central1 \
  --project=vistralai

# Note: Higher min-instances = higher costs but faster response times
```

### Performance Tuning

#### Memory Optimization

```bash
# If memory usage is high, scale up
gcloud run services update vistralai \
  --memory=4Gi \
  --region=us-central1 \
  --project=vistralai

# If memory is consistently low, scale down
gcloud run services update vistralai \
  --memory=1Gi \
  --region=us-central1 \
  --project=vistralai
```

#### CPU Optimization

```bash
# Add more CPU if latency is high
gcloud run services update vistralai \
  --cpu=4 \
  --region=us-central1 \
  --project=vistralai

# Reduce CPU if consistently underutilized
gcloud run services update vistralai \
  --cpu=1 \
  --region=us-central1 \
  --project=vistralai
```

#### Timeout Adjustment

```bash
# Increase timeout for long-running jobs
gcloud run services update vistralai \
  --timeout=5400 \
  --region=us-central1 \
  --project=vistralai
```

---

## Backup & Disaster Recovery

### Redis Backup Strategy

Cloud Memorystore does NOT have automatic backups. Implement manual backups:

```bash
# Manual backup of Redis data
gcloud redis instances backup vistralai-redis \
  --region=us-central1 \
  --project=vistralai

# List backups
gcloud redis backups list \
  --region=us-central1 \
  --project=vistralai

# Restore from backup (if needed)
gcloud redis backups restore BACKUP_ID \
  --region=us-central1 \
  --instance=vistralai-redis \
  --project=vistralai
```

### Data Backup Schedule

Set up automated backups using Cloud Scheduler:

```bash
# Create Cloud Function to trigger Redis backup
# Deploy backup function to Cloud Functions
# Then schedule with Cloud Scheduler:

gcloud scheduler jobs create pubsub redis-backup \
  --schedule="0 3 * * *" \
  --time-zone="America/New_York" \
  --topic=redis-backup \
  --message-body="{}" \
  --location=us-central1 \
  --project=vistralai
```

### Database Snapshots

For future database layer:

```bash
# If using Cloud SQL PostgreSQL:
gcloud sql backups create \
  --instance=vistralai-db \
  --project=vistralai

# List backups
gcloud sql backups list \
  --instance=vistralai-db \
  --project=vistralai
```

### Disaster Recovery Runbook

If production goes down:

1. **Assess the situation**: What's broken?
   ```bash
   # Check service status
   gcloud run services describe vistralai --region=us-central1 --project=vistralai
   gcloud run services describe firecrawl-service --region=us-central1 --project=vistralai
   gcloud redis instances describe vistralai-redis --region=us-central1 --project=vistralai
   ```

2. **Quick fix (feature flag rollback)**:
   ```bash
   gcloud run services update vistralai \
     --update-env-vars USE_FIRECRAWL=false,USE_BULL_QUEUE=false,USE_REAL_API=false \
     --region=us-central1 \
     --project=vistralai
   ```

3. **Investigate root cause**: Check logs and metrics

4. **Implement fix**: Update code or configuration

5. **Redeploy**: Push new version with `gcloud builds submit`

6. **Monitor**: Watch metrics for 30 minutes

7. **Post-mortem**: Document what happened and how to prevent it

---

## Cost Management

### Monitor Monthly Costs

```bash
# View current billing data
gcloud billing budgets list --project=vistralai

# Detailed cost breakdown
gcloud billing accounts list
gcloud billing accounts describe 01C229-59FD73-3A9B94

# Set up budget alerts
gcloud billing budgets create \
  --billing-account=01C229-59FD73-3A9B94 \
  --display-name=VistralAI-Monthly \
  --budget-amount=200 \
  --threshold-rule=percent=50,percent=100
```

### Cost Optimization Tips

1. **Min Instances Strategy**
   - Development/testing: min-instances=0 (scales to zero, saves money)
   - Production: min-instances=0-1 depending on traffic
   - Cost difference: ~$20-30/month per min instance

2. **Memory & CPU Sizing**
   - Start with 1Gi/1CPU, increase only if needed
   - Monitor actual usage: target 60-70% average
   - Right-sizing saves 20-30% costs

3. **Regional Selection**
   - US regions are cheaper than others
   - us-central1 is mid-range cost
   - Consider multi-region for disaster recovery (future)

4. **API Cost Control**
   - Claude API: ~$0.01-0.05 per extraction
   - Firecrawl: Self-hosted, only infrastructure costs
   - Set monthly budget alerts at $50/month

5. **Storage & Network**
   - Minimize inter-region data transfer
   - Use GCS for file storage (cheaper than Cloud SQL)
   - Clean up old logs regularly

### Expected Monthly Costs

```
Development (MVP):
  Cloud Run (VistralAI): $5-10
  Cloud Run (Firecrawl): $2-5
  Memorystore Redis: $30
  APIs: $10-20
  Logging/Monitoring: $1-2
  Total: $50-65/month

Production (100 users/month):
  Cloud Run (VistralAI): $15-30
  Cloud Run (Firecrawl): $5-10
  Memorystore Redis: $30
  Claude API: $10-20
  Logging/Monitoring: $2-5
  Total: $60-95/month

Production (1000 users/month):
  Cloud Run (VistralAI): $50-100
  Cloud Run (Firecrawl): $15-30
  Memorystore Redis: $30
  Claude API: $100-200
  Logging/Monitoring: $5-10
  Total: $200-370/month
```

---

## Incident Response

### Incident Severity Levels

- **SEV1 (Critical)**: Service completely down, >1000 users affected
- **SEV2 (High)**: Degraded performance, 100-1000 users affected
- **SEV3 (Medium)**: Non-critical functionality broken, <100 users affected
- **SEV4 (Low)**: Minor issues, <5 users affected

### Incident Response Process

1. **Detect**: Alerts trigger or customer reports issue
2. **Assess**: Determine severity and scope (1-30 minutes)
3. **Mitigate**: Apply temporary fix or disable feature (30-60 minutes)
4. **Fix**: Implement permanent solution (1-4 hours)
5. **Monitor**: Ensure stability (30 minutes post-fix)
6. **Review**: Post-mortem and preventive measures (next day)

### Common Incident Responses

#### Firecrawl Service Down

```bash
# Quick fix: Disable Firecrawl, use WebCrawler mock
gcloud run services update vistralai \
  --update-env-vars USE_FIRECRAWL=false \
  --region=us-central1 \
  --project=vistralai

# Long-term: Redeploy Firecrawl service
gcloud builds submit --config=cloudbuild-firecrawl.yaml --project=vistralai
```

#### Redis Connection Errors

```bash
# Check Redis status
gcloud redis instances describe vistralai-redis \
  --region=us-central1 \
  --project=vistralai

# Restart Redis (if possible)
# Note: This will cause brief data loss
gcloud redis instances restart vistralai-redis \
  --region=us-central1 \
  --project=vistralai

# If Redis is permanently broken, disable it
gcloud run services update vistralai \
  --update-env-vars USE_BULL_QUEUE=false \
  --region=us-central1 \
  --project=vistralai
```

#### High Error Rate

```bash
# Check recent errors
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR AND resource.labels.service_name=vistralai" \
  --limit=100 \
  --format=json \
  --project=vistralai | jq .[].jsonPayload

# Check for deployment issues
gcloud run services describe vistralai \
  --region=us-central1 \
  --project=vistralai \
  --format=yaml

# Rollback to previous revision if needed
gcloud run services update-traffic vistralai \
  --to-revisions=vistralai-00010=100 \
  --region=us-central1 \
  --project=vistralai
```

---

## Security Management

### Secret Rotation

```bash
# Rotate NEXTAUTH_SECRET
openssl rand -base64 32 | \
  gcloud secrets versions add nextauth-secret \
    --data-file=- \
    --project=vistralai

# Rotate ANTHROPIC_API_KEY
gcloud secrets versions add anthropic-api-key \
  --data-file=- \
  --project=vistralai

# Update service to use new secret version (automatic)
# Secrets always reference :latest version
```

### IAM Audit

```bash
# Check who has access to project
gcloud projects get-iam-policy vistralai \
  --flatten="bindings[].members" \
  --format="table(bindings.role,bindings.members)"

# Remove unnecessary permissions
gcloud projects remove-iam-policy-binding vistralai \
  --member=user:someone@example.com \
  --role=roles/editor
```

### Network Security

```bash
# Check VPC Connector security
gcloud compute networks vpc-access connectors describe vistralai-connector \
  --region=us-central1 \
  --project=vistralai

# Verify Firecrawl is not publicly accessible
gcloud run services get-iam-policy firecrawl-service \
  --region=us-central1 \
  --project=vistralai
```

### Audit Logging

```bash
# Enable Cloud Audit Logs (if not already enabled)
gcloud logging sinks create admin-audit \
  logging.googleapis.com/projects/vistralai/logs/cloudaudit.googleapis.com%2Factivity \
  --log-filter='protoPayload.methodName=~"compute\\.instances\\."' \
  --project=vistralai

# View audit logs
gcloud logging read "protoPayload.methodName=storage.buckets.create" \
  --limit=50 \
  --project=vistralai
```

---

## Updates & Maintenance

### Deploying Updates

```bash
# Standard deployment process
git add .
git commit -m "Feature: Add new optimization"
git push origin main

# Cloud Build automatically triggers deployment
# Monitor the build
gcloud builds list --limit=10 --project=vistralai

# View build logs
gcloud builds log BUILD_ID --project=vistralai
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update packages safely
npm update

# For major version updates, test thoroughly
npm install --save package@^NEW_VERSION
npm run build
npm test

# Deploy after testing
git commit -m "chore: Update dependencies"
git push origin main
```

### Updating Configuration

```bash
# Update environment variables without redeploying
gcloud run services update vistralai \
  --update-env-vars CLAUDE_MODEL=claude-opus-4-1 \
  --region=us-central1 \
  --project=vistralai
```

### Maintenance Windows

Schedule maintenance during low-traffic times:

- Recommended: Tuesday-Thursday, 2-4 AM UTC
- Notify users 24-48 hours in advance
- Plan for 30-60 minutes of potential downtime

```bash
# Perform maintenance
# 1. Stop accepting new requests (if needed)
# 2. Wait for in-flight requests to complete
# 3. Deploy updates
# 4. Test thoroughly
# 5. Resume accepting requests
```

---

## Common Issues & Solutions

### Issue: Slow Response Times

**Symptoms**: Request latency >1 second

**Root Causes**:
1. Cold start (first request after idle period)
2. High CPU/memory usage
3. Slow network (Firecrawl, Redis)
4. Database query performance

**Solutions**:
```bash
# Check instance count and cold start frequency
gcloud run services describe vistralai \
  --region=us-central1 \
  --project=vistralai \
  --format='yaml(spec.template.spec)'

# Increase min-instances to keep warm
gcloud run services update vistralai \
  --min-instances=1 \
  --region=us-central1 \
  --project=vistralai

# Increase memory/CPU
gcloud run services update vistralai \
  --memory=4Gi \
  --cpu=4 \
  --region=us-central1 \
  --project=vistralai
```

### Issue: High Memory Usage

**Symptoms**: Memory usage >80%, OOM kills

**Root Causes**:
1. Memory leak in application
2. Large dataset cached in memory
3. Insufficient memory allocation

**Solutions**:
```bash
# Monitor memory usage
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/container_memory_utilizations" \
  --project=vistralai

# Increase memory
gcloud run services update vistralai \
  --memory=4Gi \
  --region=us-central1 \
  --project=vistralai

# Find memory leaks in code review
```

### Issue: Redis Disconnection

**Symptoms**: "ECONNREFUSED", "Connection timeout"

**Root Causes**:
1. Redis instance down or restarting
2. VPC connector down
3. Network connectivity issues

**Solutions**:
```bash
# Check Redis status
gcloud redis instances describe vistralai-redis \
  --region=us-central1 \
  --project=vistralai

# Check VPC connector
gcloud compute networks vpc-access connectors describe vistralai-connector \
  --region=us-central1 \
  --project=vistralai

# Disable Redis temporarily
gcloud run services update vistralai \
  --update-env-vars USE_BULL_QUEUE=false \
  --region=us-central1 \
  --project=vistralai
```

### Issue: API Rate Limiting

**Symptoms**: "Rate limit exceeded", 429 errors

**Root Causes**:
1. Too many requests to Claude API
2. Too many website crawls
3. Traffic spike

**Solutions**:
```bash
# Implement request queuing (already in Bull queue)
# Monitor API usage
gcloud logging read "resource.labels.service_name=vistralai AND jsonPayload.message=~'rate.*limit'" \
  --limit=50 \
  --project=vistralai

# Set quota alerts
# Contact API provider for increased limits
```

---

## Useful Commands

### Quick Status Check

```bash
# All-in-one status check
echo "=== VistralAI Status ===" && \
gcloud run services describe vistralai --region=us-central1 --project=vistralai --format='table(status.conditions[0].status)' && \
echo "=== Firecrawl Status ===" && \
gcloud run services describe firecrawl-service --region=us-central1 --project=vistralai --format='table(status.conditions[0].status)' && \
echo "=== Redis Status ===" && \
gcloud redis instances describe vistralai-redis --region=us-central1 --project=vistralai --format='value(state)'
```

### View Real-time Logs

```bash
# Follow logs in real-time
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=vistralai" \
  --follow \
  --format='table(timestamp, jsonPayload.message, severity)' \
  --project=vistralai

# Filter for errors
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR AND resource.labels.service_name=vistralai" \
  --follow \
  --format='table(timestamp, jsonPayload.message)' \
  --project=vistralai
```

### Performance Metrics

```bash
# CPU usage
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/container_cpu_utilizations" \
  --format='table(metric.labels.container_name, points[0].value.double_value)' \
  --project=vistralai

# Memory usage
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/container_memory_utilizations" \
  --format='table(metric.labels.container_name, points[0].value.double_value)' \
  --project=vistralai

# Request count
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/request_count" \
  --format='table(points[0].value.int64_value)' \
  --project=vistralai
```

### Deployment Control

```bash
# Pause deployments (stop accepting new builds)
gcloud run services update vistralai --no-traffic-split --region=us-central1 --project=vistralai

# Resume deployments
gcloud run services update-traffic vistralai --to-revisions=LATEST=100 --region=us-central1 --project=vistralai

# Force redeploy current version
gcloud run deploy vistralai \
  --image=gcr.io/vistralai/vistralai:latest \
  --region=us-central1 \
  --project=vistralai
```

---

## Escalation Contacts

- **On-Call Engineer**: (from on-call rotation)
- **Tech Lead**: (team lead contact)
- **Cloud Support**: GCP Premium Support
- **Firecrawl Support**: support@firecrawl.dev
- **Anthropic Support**: support@anthropic.com

---

## Additional Resources

- [Cloud Run Best Practices](https://cloud.google.com/run/docs/tips/general)
- [Cloud Monitoring Best Practices](https://cloud.google.com/stackdriver/docs/best-practices)
- [Redis Best Practices](https://cloud.google.com/memorystore/docs/redis/best-practices)
- [Production Checklist](https://cloud.google.com/run/docs/quickstarts/deploy-container#before_you_begin)

---

**Last Updated**: November 2024
**Maintained By**: DevOps/Infrastructure Team
**Review Cycle**: Quarterly
