# VistralAI Admin & Operator Runbooks

**Step-by-step procedures for common administrative and operational tasks.**

---

## Table of Contents

1. [User Management](#user-management)
2. [Account Management](#account-management)
3. [Troubleshooting Guide](#troubleshooting-guide)
4. [Performance Tuning](#performance-tuning)
5. [Backup & Recovery](#backup--recovery)
6. [Incident Response](#incident-response)
7. [Maintenance Tasks](#maintenance-tasks)

---

## User Management

### Adding a New User

**Scenario**: New team member or customer needs access

**Steps**:
1. User creates account at https://vistralai.app/auth/register
2. User receives verification email
3. User clicks verification link
4. User sets up 2FA (future)
5. User complete initial onboarding

**Verification**:
```bash
# Check user created successfully
gcloud logging read "eventName=google.iam.admin.v1.CreateServiceAccount" \
  --limit=10 \
  --project=vistralai
```

### Reset User Password

**Scenario**: User forgot password or account compromised

**Steps**:
1. User clicks "Forgot Password" on login page
2. User enters email address
3. User receives password reset email
4. User clicks reset link and sets new password
5. User logs in with new password

**If Email Issues**:
1. Go to https://vistralai.app/auth/reset-password
2. Enter email address
3. Check spam folder
4. Contact support if email not received

### Delete User Account

**Scenario**: User wants to delete their account

**Steps**:
1. User goes to Settings → Account
2. Scrolls to bottom
3. Clicks "Delete Account"
4. Confirms deletion (irreversible)
5. Account and all data permanently deleted

**Admin Verification**:
```bash
# Confirm user deletion from logs
gcloud logging read "protoPayload.methodName=users.delete" \
  --filter="protoPayload.request.email=user@example.com" \
  --limit=1 \
  --project=vistralai
```

### Disable User (Future)

Coming in Phase 11: Ability to disable accounts without deletion.

---

## Account Management

### Setting Up a New Brand Account

**Scenario**: User completes signup and needs to onboard their brand

**Steps**:
1. User logs in to dashboard
2. User sees "Set Up Your Brand" prompt
3. User enters company domain
4. User completes onboarding wizard
5. Brand 360° profile auto-populated
6. User can start analyzing visibility

**Monitor Onboarding**:
```bash
# Watch onboarding jobs in progress
watch -n 5 'gcloud logging read "resource.labels.service_name=vistralai AND jsonPayload.phase=\"onboarding\"" \
  --limit=20 \
  --project=vistralai'
```

### Update Brand Information

**Scenario**: Brand information changes (name, domain, etc.)

**Steps**:
1. User goes to Brand 360° Profile
2. User clicks "Edit" on desired section
3. User updates information
4. User clicks "Save"
5. Changes saved immediately

**Verify Update**:
```bash
# Check brand update in logs
gcloud logging read "resource.labels.service_name=vistralai AND protoPayload.request.brandId=brand_123" \
  --limit=5 \
  --project=vistralai
```

### Manage Multiple Brands (Future)

Coming in Phase 11: Users can add multiple brands to one account.

```
User Account
├── Brand 1 (Company A)
├── Brand 2 (Company B)
└── Brand 3 (Company C)
```

### Reset Brand Data

**Scenario**: User wants to start over with brand analysis

**Steps**:
1. Go to Brand 360° Profile
2. Click "Settings" (gear icon)
3. Click "Reset All Data"
4. Confirm (irreversible)
5. All data cleared, ready for fresh onboarding

---

## Troubleshooting Guide

### Issue: Login Fails

**Symptoms**: User can't log in, gets "Invalid credentials" error

**Diagnosis**:
1. Check email is registered:
   ```bash
   gcloud logging read "resource.labels.service_name=vistralai AND jsonPayload.event=login_attempt" \
     --filter="jsonPayload.email=user@example.com" \
     --limit=5 \
     --project=vistralai
   ```

2. Check for account lockout (after 5 failed attempts):
   ```bash
   # Look for lockout events
   gcloud logging read "jsonPayload.event=account_locked" \
     --filter="jsonPayload.email=user@example.com" \
     --limit=1 \
     --project=vistralai
   ```

**Solution**:
- Ask user to check caps lock
- Try "Forgot Password" to reset
- If account locked, wait 15 minutes or contact support
- Check email in spam folder for reset link

### Issue: Onboarding Hangs

**Symptoms**: Onboarding job stuck at "Crawling" or "Extracting"

**Diagnosis**:
```bash
# Check job status
JOB_ID="job_12345"
gcloud logging read "resource.labels.service_name=vistralai AND jsonPayload.jobId=$JOB_ID" \
  --limit=20 \
  --project=vistralai

# Check queue status
gcloud run services describe vistralai \
  --region=us-central1 \
  --project=vistralai
```

**Solutions**:
1. **Stuck on Crawling (>5 minutes)**:
   - Website may be blocking crawlers
   - DNS or network issues
   - Action: Try again in 5 minutes or use manual entry

2. **Stuck on Extracting (>2 minutes)**:
   - Claude API may be rate limited
   - Large content to analyze
   - Action: Wait or try with smaller website

3. **Stuck on Review (>1 minute)**:
   - Review queue service issue
   - Action: Refresh page, try again

### Issue: Missing Data in Dashboard

**Symptoms**: Dashboard shows empty metrics, no data

**Diagnosis**:
```bash
# Check if onboarding completed
gcloud logging read "resource.labels.service_name=vistralai AND jsonPayload.event=onboarding_complete" \
  --filter="jsonPayload.brandId=brand_123" \
  --limit=1 \
  --project=vistralai

# Check if analysis results stored
curl -s -H "Authorization: Bearer TOKEN" \
  https://vistralai.run.app/api/brand-360/identity?brandId=brand_123 | jq .
```

**Solutions**:
1. **Onboarding not completed**:
   - User needs to complete Brand 360° profile
   - Check for pending reviews in review queue

2. **Data stored but not displaying**:
   - Hard refresh page (Ctrl+Shift+R)
   - Wait for daily data refresh (3 AM UTC)
   - Check browser console for errors

3. **Time range filter wrong**:
   - Check dashboard filter at top
   - Ensure time range includes analysis dates

### Issue: High Error Rate

**Symptoms**: Errors in logs, failed jobs, user complaints

**Diagnosis**:
```bash
# Check error logs
gcloud logging read "resource.labels.service_name=vistralai AND severity=ERROR" \
  --format="table(timestamp, jsonPayload.error, jsonPayload.stackTrace)" \
  --limit=50 \
  --project=vistralai

# Check queue status
curl -s https://vistralai.run.app/api/admin/queue-stats | jq .data.stats

# Check Firecrawl service
gcloud run services describe firecrawl-service \
  --region=us-central1 \
  --project=vistralai
```

**Common Causes**:
1. **Redis unavailable**:
   ```bash
   gcloud redis instances describe vistralai-redis \
     --region=us-central1 \
     --project=vistralai
   ```
   → Restart Redis or check VPC connector

2. **Firecrawl service down**:
   ```bash
   gcloud run services list --region=us-central1 --project=vistralai
   ```
   → Redeploy Firecrawl or disable feature flag

3. **Claude API issues**:
   → Check Anthropic API status
   → Verify API key is valid
   → Check rate limiting in logs

4. **Memory/CPU exhausted**:
   ```bash
   gcloud monitoring time-series list \
     --filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/container_memory_utilizations" \
     --project=vistralai
   ```
   → Increase instance resources

### Issue: Slow Performance

**Symptoms**: Responses take >1-2 seconds, timeouts

**Diagnosis**:
```bash
# Check latency metrics
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/request_latencies" \
  --project=vistralai

# Check instance count
gcloud run services describe vistralai \
  --region=us-central1 \
  --project=vistralai \
  --format="table(status.conditions[0].message)"

# Check Firecrawl performance
time curl -s http://firecrawl-service:3000/health
```

**Solutions**:
1. **Cold starts (first request after idle)**:
   - Increase min-instances to 1
   - Acceptable for MVP, revisit if issue continues

2. **High CPU/memory usage**:
   - Increase resources (--memory=4Gi --cpu=4)
   - Optimize code (profiling)
   - Add caching

3. **Network latency**:
   - Check VPC connectivity
   - Verify Firecrawl response time
   - Check Redis latency

---

## Performance Tuning

### Optimize Memory Usage

**Current Memory**: 2Gi per VistralAI instance

**Check Usage**:
```bash
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/container_memory_utilizations" \
  --project=vistralai \
  --format="table(resource.labels.revision_name, points[0].value.double_value)"
```

**Actions**:
- If consistently >80%: Increase to 4Gi
- If consistently <40%: Reduce to 1Gi (saves money)

### Optimize CPU Usage

**Check Usage**:
```bash
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/container_cpu_utilizations" \
  --project=vistralai
```

**Actions**:
- If consistently >70%: Increase CPU to 4
- If consistently <20%: Reduce to 1 (saves money)

### Optimize Scaling

**Current Config**: Min=0, Max=20 instances

**Monitor Scaling**:
```bash
watch -n 2 'gcloud run services describe vistralai \
  --region=us-central1 \
  --project=vistralai \
  --format="table(status.conditions[0].message)"'
```

**Actions**:
- If max instances consistently hit: Increase max
- If rarely scaled up: Reduce max (saves money)
- If cold starts problematic: Increase min-instances

### Optimize Database Queries (Future)

Once database is implemented:
- Add indexes on frequently queried columns
- Use prepared statements
- Implement connection pooling
- Cache frequent queries

---

## Backup & Recovery

### Manual Redis Backup

**Create Backup**:
```bash
gcloud redis instances backup vistralai-redis \
  --region=us-central1 \
  --project=vistralai
```

**List Backups**:
```bash
gcloud redis backups list \
  --region=us-central1 \
  --project=vistralai \
  --format="table(id, creationTime, size)"
```

**Restore from Backup**:
```bash
# Get backup ID
BACKUP_ID=$(gcloud redis backups list \
  --region=us-central1 \
  --project=vistralai \
  --limit=1 \
  --format="value(id)")

# Restore
gcloud redis backups restore $BACKUP_ID \
  --region=us-central1 \
  --instance=vistralai-redis \
  --project=vistralai
```

**Note**: Restoring will temporarily make Redis unavailable. Do during maintenance window.

### Automated Backup Schedule (Future)

Set up Cloud Scheduler to run backups daily:
```bash
gcloud scheduler jobs create pubsub redis-backup \
  --schedule="0 3 * * *" \
  --time-zone="America/New_York" \
  --topic=redis-backup \
  --message-body="{}" \
  --location=us-central1 \
  --project=vistralai
```

### Disaster Recovery Scenarios

**Scenario 1: Complete Service Failure**
```
1. Check service status
2. Disable all feature flags (fallback to mocks)
3. Verify service still responding
4. Investigate root cause
5. Fix issue and redeploy
```

**Scenario 2: Data Corruption**
```
1. Disable writes to Redis
2. Restore from backup
3. Re-run recent jobs
4. Verify data integrity
5. Resume service
```

**Scenario 3: Deployment Issues**
```
1. Rollback to previous revision
2. Investigate issue locally
3. Apply fix
4. Redeploy
5. Monitor for stability
```

---

## Incident Response

### SEV1: Service Down

**Immediate Response** (within 1 minute):
```bash
# 1. Check service status
gcloud run services describe vistralai --region=us-central1 --project=vistralai

# 2. Check recent errors
gcloud logging read "resource.labels.service_name=vistralai AND severity=ERROR" \
  --limit=10 \
  --project=vistralai

# 3. Check dependencies (Redis, Firecrawl)
gcloud redis instances describe vistralai-redis --region=us-central1 --project=vistralai
gcloud run services describe firecrawl-service --region=us-central1 --project=vistralai

# 4. If feature flag issue, disable features
gcloud run services update vistralai \
  --update-env-vars USE_FIRECRAWL=false,USE_BULL_QUEUE=false,USE_REAL_API=false \
  --region=us-central1 \
  --project=vistralai
```

**Recovery** (within 5 minutes):
- Apply quick fix or rollback
- Verify service responding
- Monitor for stability
- Notify users

### SEV2: High Error Rate

**Investigation**:
```bash
# Get error details
gcloud logging read "resource.labels.service_name=vistralai AND severity=ERROR" \
  --format="table(timestamp, jsonPayload.error)" \
  --limit=20 \
  --project=vistralai

# Identify pattern
# - API errors? Check logs
# - Job queue issues? Check Redis
# - External API? Check status pages
```

**Mitigation**:
1. Disable problematic feature
2. Increase logging/monitoring
3. Wait for recovery or deploy fix
4. Monitor for regression

### SEV3: Degraded Performance

**Investigation**:
```bash
# Check metrics
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision" \
  --project=vistralai

# Check load
gcloud logging read "resource.labels.service_name=vistralai" \
  --limit=100 \
  --project=vistralai | jq 'length'
```

**Mitigation**:
1. Monitor trend
2. Increase resources if needed
3. Check for code issues
4. Optimize if possible

### Post-Incident Review

After any SEV1 or SEV2 incident:
```bash
# 1. Document what happened
# 2. Analyze logs for root cause
# 3. Implement preventive measures
# 4. Update runbooks if needed
# 5. Share learnings with team
```

---

## Maintenance Tasks

### Daily Tasks

**Every morning** (or automated):
```bash
#!/bin/bash
# Daily health check

echo "=== VistralAI Daily Health Check ==="

# 1. Service availability
gcloud run services describe vistralai \
  --region=us-central1 \
  --project=vistralai \
  --format="table(status.conditions[0].status)"

# 2. Error rate (last hour)
gcloud logging read "resource.labels.service_name=vistralai AND severity=ERROR AND timestamp>=\"$(date -u -d '1 hour ago' +'%Y-%m-%dT%H:%M:%SZ')\"" \
  --project=vistralai \
  --format="value(severity)" | wc -l

# 3. Recent deployments
gcloud run services describe vistralai \
  --region=us-central1 \
  --project=vistralai \
  --format="table(status.observedGeneration, metadata.generation)"
```

### Weekly Tasks

**Every Monday**:
1. Review error logs and patterns
2. Check cost trends
3. Review capacity planning
4. Update documentation if needed
5. Plan for upcoming releases

### Monthly Tasks

**First of month**:
1. Review monthly costs
2. Plan for next month
3. Audit user accounts
4. Check certificate expiry
5. Update architecture diagrams

### Quarterly Tasks

**Every 3 months**:
1. Security audit
2. Performance review
3. Disaster recovery drill
4. Update runbooks
5. Plan roadmap for next quarter

### Annual Tasks

**Every 12 months**:
1. Penetration testing
2. Compliance audit (SOC 2)
3. Architecture review
4. Full disaster recovery test
5. Strategy planning for next year

---

## Common Administrative Commands

### User Management
```bash
# List active users
gcloud logging read "resource.labels.service_name=vistralai AND event=login" \
  --limit=100 \
  --project=vistralai | jq -r '.[] | .protoPayload.request.email' | sort | uniq

# Get user signup dates
gcloud logging read "event=user_created" \
  --limit=100 \
  --project=vistralai | jq '.[] | {email: .protoPayload.request.email, timestamp: .timestamp}'
```

### Service Management
```bash
# Restart service (force new deployment)
gcloud run deploy vistralai \
  --image=gcr.io/vistralai/vistralai:latest \
  --region=us-central1 \
  --project=vistralai

# Scale to specific number of instances
gcloud run services update vistralai \
  --min-instances=2 \
  --max-instances=50 \
  --region=us-central1 \
  --project=vistralai
```

### Monitoring
```bash
# Export metrics for analysis
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision" \
  --format="json" > metrics.json

# Generate cost report
gcloud billing accounts list
gcloud billing budgets list --billing-account=ACCOUNT_ID
```

---

## Contact & Escalation

- **Tier 1 Support**: support@vistralai.com
- **Tier 2 (Escalation)**: tech-lead@vistralai.com
- **Emergency (SEV1)**: On-call engineer (see rotation)
- **GCP Support**: Premium Support contract
- **Anthropic Support**: support@anthropic.com
- **Firecrawl Support**: support@firecrawl.dev

---

**Last Updated**: November 2024
**Maintained By**: Operations Team
**Review Cycle**: Quarterly
