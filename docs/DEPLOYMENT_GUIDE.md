# VistralAI Production Deployment Guide

**Complete step-by-step instructions for deploying VistralAI to production on Google Cloud Run with Firecrawl, Bull + Redis, and comprehensive monitoring.**

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Architecture Overview](#architecture-overview)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Firecrawl Service Deployment](#firecrawl-service-deployment)
5. [VistralAI Main Service Deployment](#vistralai-main-service-deployment)
6. [Monitoring & Alerts Setup](#monitoring--alerts-setup)
7. [Validation & Testing](#validation--testing)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Cost Optimization](#cost-optimization)

---

## Pre-Deployment Checklist

### GCP Project Setup
- [ ] GCP project created and billing enabled
- [ ] Project ID noted: `PROJECT_ID=vistralai`
- [ ] Region selected: `REGION=us-central1`

### Required APIs Enabled
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  redis.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  compute.googleapis.com \
  --project=$PROJECT_ID
```

### Code Readiness
- [ ] All tests pass: `npm test`
- [ ] Build succeeds locally: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Code is committed and pushed to main branch

### Secrets Prepared
- [ ] NEXTAUTH_SECRET generated and created in Secret Manager
- [ ] ANTHROPIC_API_KEY obtained from Anthropic
- [ ] All secrets stored in Google Secret Manager (never in code)

### IAM Permissions
- [ ] Cloud Build service account has:
  - `roles/run.admin` (deploy Cloud Run services)
  - `roles/iam.serviceAccountUser` (manage service accounts)
  - `roles/secretmanager.secretAccessor` (read secrets)
  - `roles/compute.networkAdmin` (manage VPC)
- [ ] Your user account has `roles/editor` or equivalent

---

## Architecture Overview

### Service Components

```
┌────────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐    ┌───────────────────────────┐ │
│  │   VistralAI Main Service │    │  Firecrawl Service        │ │
│  │ (Cloud Run)              │    │ (Cloud Run)               │ │
│  │                          │    │                           │ │
│  │ Port: 8080 (HTTPS)       │◄──►│ Port: 3000 (HTTP)         │ │
│  │ Memory: 2Gi              │ VPC│ Memory: 1Gi               │ │
│  │ CPU: 2                   │    │ CPU: 1                    │ │
│  │ Min: 0, Max: 20 instances│    │ Min: 0, Max: 10 instances │ │
│  └──────────────────────────┘    └───────────────────────────┘ │
│         ▲                                      │                │
│         │ HTTPS                                │ HTTP (internal)│
│         │ (Public)                             │ (VPC only)     │
│  ┌──────┴───────────────────────────────────────┴────────────┐ │
│  │ Cloud Run VPC Connector (vistralai-connector)             │ │
│  └──────┬────────────────────────────────────────────────────┘ │
│         │                                                       │
│  ┌──────▼──────────────────────────────────────────────────┐  │
│  │ Cloud Memorystore for Redis                            │  │
│  │                                                         │   │
│  │ Instance: vistralai-redis                             │  │
│  │ Memory: 1GB                                            │  │
│  │ Version: Redis 7.0                                    │  │
│  │ Access: VPC-native (private)                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
         ▲
         │ HTTPS
      Browser
```

### Data Flow

1. **User Request** → VistralAI (Cloud Run) - HTTPS public endpoint
2. **Website Analysis** → Firecrawl (Cloud Run) - Internal HTTP via VPC
3. **Job Processing** → Redis (Memorystore) - Async job queue
4. **Response** → Back to user

### Network Security

- VistralAI: Public HTTPS endpoint, authenticated users only
- Firecrawl: Private HTTP endpoint, VPC access only
- Redis: Private TCP, VPC access only
- No service is directly exposed to the internet

---

## Infrastructure Setup

### Step 1: Set Environment Variables

```bash
export PROJECT_ID=vistralai
export REGION=us-central1
export SERVICE_NAME=vistralai
export FIRECRAWL_SERVICE=firecrawl-service
export REDIS_INSTANCE=vistralai-redis
export VPC_CONNECTOR=vistralai-connector

# Verify project is set
gcloud config set project $PROJECT_ID
gcloud config get-value project
```

### Step 2: Create VPC and VPC Connector

VPC connector enables Cloud Run services to connect to private resources like Memorystore.

```bash
# Create VPC (if not already exists)
gcloud compute networks create vistralai-vpc \
  --subnet-mode=custom \
  --project=$PROJECT_ID \
  || echo "VPC already exists"

# Create subnet
gcloud compute networks subnets create vistralai-subnet \
  --network=vistralai-vpc \
  --range=10.0.0.0/24 \
  --region=$REGION \
  --project=$PROJECT_ID \
  || echo "Subnet already exists"

# Create VPC connector (this may take 10-15 minutes)
echo "Creating VPC connector... (this takes ~10-15 minutes)"
gcloud compute networks vpc-access connectors create $VPC_CONNECTOR \
  --network=vistralai-vpc \
  --region=$REGION \
  --range=10.1.0.0/28 \
  --project=$PROJECT_ID \
  --machine-type=e2-micro
```

### Step 3: Create Secrets in Secret Manager

```bash
# Create NEXTAUTH_SECRET (generate if not already created)
echo "Creating NEXTAUTH_SECRET..."
if ! gcloud secrets describe nextauth-secret --project=$PROJECT_ID 2>/dev/null; then
  openssl rand -base64 32 | \
    gcloud secrets create nextauth-secret \
      --data-file=- \
      --replication-policy="automatic" \
      --project=$PROJECT_ID
else
  echo "NEXTAUTH_SECRET already exists"
fi

# Create ANTHROPIC_API_KEY
echo "Creating ANTHROPIC_API_KEY..."
echo "Enter your Anthropic API key (will be hidden):"
read -s ANTHROPIC_KEY

if ! gcloud secrets describe anthropic-api-key --project=$PROJECT_ID 2>/dev/null; then
  echo -n "$ANTHROPIC_KEY" | \
    gcloud secrets create anthropic-api-key \
      --data-file=- \
      --replication-policy="automatic" \
      --project=$PROJECT_ID
else
  echo -n "$ANTHROPIC_KEY" | \
    gcloud secrets versions add anthropic-api-key \
      --data-file=- \
      --project=$PROJECT_ID
fi

echo "Secrets created successfully"
```

### Step 4: Provision Cloud Memorystore for Redis

```bash
# Create Redis instance (this takes ~5 minutes)
echo "Creating Cloud Memorystore for Redis..."
gcloud redis instances create $REDIS_INSTANCE \
  --size=1 \
  --region=$REGION \
  --redis-version=7.0 \
  --tier=basic \
  --connect-mode=private \
  --network=vistralai-vpc \
  --project=$PROJECT_ID

# Wait for instance to be ready
echo "Waiting for Redis instance to be ready..."
for i in {1..60}; do
  STATUS=$(gcloud redis instances describe $REDIS_INSTANCE \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format='value(state)' 2>/dev/null || echo "CREATING")

  if [ "$STATUS" = "READY" ]; then
    echo "Redis instance is ready!"
    break
  fi

  echo "Status: $STATUS (attempt $i/60)"
  sleep 10
done

# Get Redis connection details
REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(host)')

REDIS_PORT=$(gcloud redis instances describe $REDIS_INSTANCE \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(port)')

REDIS_URL="redis://$REDIS_HOST:$REDIS_PORT"

echo "Redis connection details:"
echo "  Host: $REDIS_HOST"
echo "  Port: $REDIS_PORT"
echo "  URL: $REDIS_URL"

# Store REDIS_URL for next steps
export REDIS_URL=$REDIS_URL
```

---

## Firecrawl Service Deployment

### Step 1: Deploy Firecrawl to Cloud Run

```bash
# Set defaults for Firecrawl deployment
export FIRECRAWL_REGION=$REGION
export FIRECRAWL_MEMORY=1Gi
export FIRECRAWL_CPU=1
export FIRECRAWL_MIN_INSTANCES=0
export FIRECRAWL_MAX_INSTANCES=10

# Deploy using Cloud Build
echo "Deploying Firecrawl service..."
gcloud builds submit \
  --config=cloudbuild-firecrawl.yaml \
  --substitutions=_REGION=$FIRECRAWL_REGION,_MEMORY=$FIRECRAWL_MEMORY,_CPU=$FIRECRAWL_CPU,_MIN_INSTANCES=$FIRECRAWL_MIN_INSTANCES,_MAX_INSTANCES=$FIRECRAWL_MAX_INSTANCES \
  --project=$PROJECT_ID

# Wait for deployment to complete
echo "Waiting for Firecrawl service to be ready..."
sleep 30

# Verify Firecrawl is running
FIRECRAWL_URL=$(gcloud run services describe $FIRECRAWL_SERVICE \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(status.url)' 2>/dev/null)

if [ -z "$FIRECRAWL_URL" ]; then
  echo "ERROR: Firecrawl service not found"
  exit 1
fi

echo "Firecrawl service deployed successfully"
echo "  URL: $FIRECRAWL_URL"
```

### Step 2: Configure Firecrawl Service Networking

```bash
# Set VPC connector for Firecrawl
gcloud run services update $FIRECRAWL_SERVICE \
  --vpc-connector=$VPC_CONNECTOR \
  --region=$REGION \
  --project=$PROJECT_ID

# Set Firecrawl to not allow unauthenticated access
gcloud run services update $FIRECRAWL_SERVICE \
  --no-allow-unauthenticated \
  --region=$REGION \
  --project=$PROJECT_ID

echo "Firecrawl service networking configured"
```

### Step 3: Grant Service Account Permissions

```bash
# Get Cloud Run default service account
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"

# Grant Firecrawl access to VistralAI service account
gcloud run services add-iam-policy-binding $FIRECRAWL_SERVICE \
  --region=$REGION \
  --member="serviceAccount:${PROJECT_ID}-compute@developer.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --project=$PROJECT_ID

echo "Service account permissions granted"
```

---

## VistralAI Main Service Deployment

### Step 1: Configure Production Environment

```bash
# Get actual service URL (will be updated after first deployment)
NEXTAUTH_URL="https://${SERVICE_NAME}-$(openssl rand -hex 4).run.app"

# Update environment configuration (will refine after first deploy)
echo "VistralAI production configuration:"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Memory: 2Gi"
echo "  CPU: 2"
echo "  Min instances: 0"
echo "  Max instances: 20"
echo "  Redis URL: $REDIS_URL"
echo "  Firecrawl URL: http://${FIRECRAWL_SERVICE}:3000"
```

### Step 2: Deploy VistralAI with Cloud Build

```bash
# Deploy using Cloud Build with production settings
echo "Deploying VistralAI main service..."

gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=$REGION,_MEMORY=2Gi,_CPU=2,_MIN_INSTANCES=0,_MAX_INSTANCES=20,_NEXTAUTH_URL=${NEXTAUTH_URL},_USE_FIRECRAWL=true,_USE_BULL_QUEUE=true,_USE_REAL_API=true,_FIRECRAWL_INTERNAL_URL="http://${FIRECRAWL_SERVICE}:3000",_REDIS_URL=${REDIS_URL},_CONFIDENCE_THRESHOLD=0.85,_CLAUDE_MODEL=claude-sonnet-4-20250514 \
  --project=$PROJECT_ID

echo "VistralAI deployment started..."
echo "Build logs: https://console.cloud.google.com/cloud-build/builds"
```

### Step 3: Wait for Deployment and Update NEXTAUTH_URL

```bash
# Wait for service to be ready
echo "Waiting for VistralAI service to be ready..."
sleep 30

# Get actual service URL
ACTUAL_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(status.url)' 2>/dev/null)

if [ -z "$ACTUAL_URL" ]; then
  echo "ERROR: VistralAI service not found. Check Cloud Build logs."
  exit 1
fi

echo "VistralAI deployed successfully!"
echo "  URL: $ACTUAL_URL"

# Update NEXTAUTH_URL environment variable with actual service URL
echo "Updating NEXTAUTH_URL to actual service URL..."
gcloud run services update $SERVICE_NAME \
  --update-env-vars NEXTAUTH_URL=$ACTUAL_URL \
  --region=$REGION \
  --project=$PROJECT_ID

echo "NEXTAUTH_URL updated successfully"
```

### Step 4: Verify Deployment

```bash
# Check service details
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID

# Test service accessibility
echo "Testing VistralAI service..."
curl -s $ACTUAL_URL | head -20

echo "Deployment verification complete"
```

---

## Monitoring & Alerts Setup

### Step 1: Create Cloud Monitoring Dashboard

```bash
# Create dashboard for VistralAI
gcloud monitoring dashboards create \
  --config='{
    "displayName": "VistralAI Production Dashboard",
    "mosaicLayout": {
      "columns": 12,
      "tiles": [
        {
          "width": 6,
          "height": 4,
          "widget": {
            "title": "VistralAI Request Count",
            "xyChart": {
              "dataSets": [{
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_run_revision\" resource.label.service_name=\"'$SERVICE_NAME'\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  }
                }
              }]
            }
          }
        },
        {
          "xPos": 6,
          "width": 6,
          "height": 4,
          "widget": {
            "title": "Error Rate",
            "xyChart": {
              "dataSets": [{
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_run_revision\" resource.label.service_name=\"'$SERVICE_NAME'\" metric.type=\"logging.googleapis.com/user/error_rate\""
                  }
                }
              }]
            }
          }
        }
      ]
    }
  }' \
  --project=$PROJECT_ID

echo "Dashboard created successfully"
echo "View at: https://console.cloud.google.com/monitoring/dashboards"
```

### Step 2: Create Alert Policies

```bash
# Alert for high error rate
echo "Creating error rate alert..."
gcloud alpha monitoring policies create \
  --notification-channels=$(gcloud alpha monitoring channels list --filter="displayName:Email" --format="value(name)" | head -1) \
  --display-name="VistralAI High Error Rate" \
  --condition-display-name="Error rate > 1%" \
  --condition-threshold-value=0.01 \
  --condition-threshold-comparison=COMPARISON_GT \
  --condition-threshold-duration=300s \
  --project=$PROJECT_ID || echo "Alert policy may already exist"

# Alert for high latency
echo "Creating latency alert..."
# (Note: Detailed alert creation requires more complex configuration)
# Recommend using Cloud Console for alert policy creation

echo "Alert policies created (check Cloud Monitoring console for details)"
```

### Step 3: Enable Cloud Logging

```bash
# Cloud Logging is enabled by default for Cloud Run
# View logs with:
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
  --limit 50 \
  --format json \
  --project=$PROJECT_ID

echo "Cloud Logging enabled for VistralAI"
echo "View logs: https://console.cloud.google.com/logs/query"
```

---

## Validation & Testing

### Step 1: Health Check

```bash
# Test service endpoint
echo "Testing VistralAI health endpoint..."
curl -s $ACTUAL_URL/health | jq . || curl -s $ACTUAL_URL

# Check service status
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='yaml(status.conditions)'
```

### Step 2: Full Onboarding Flow Test

```bash
# Navigate to service URL
echo "Visit the application at: $ACTUAL_URL"
echo ""
echo "Test checklist:"
echo "  [ ] Application loads successfully"
echo "  [ ] Login/authentication works"
echo "  [ ] Dashboard displays correctly"
echo "  [ ] Can start onboarding flow"
echo "  [ ] Website analysis completes (uses real Firecrawl)"
echo "  [ ] Review queue appears for low-confidence data"
echo "  [ ] Can approve/edit reviews"
echo "  [ ] Job completion shows success"
```

### Step 3: Monitor Logs for Errors

```bash
# Watch logs in real-time
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
  --limit 100 \
  --follow \
  --format "table(timestamp, jsonPayload.message)" \
  --project=$PROJECT_ID
```

### Step 4: Performance Testing

```bash
# Check response time
time curl -s $ACTUAL_URL > /dev/null

# Monitor instance count scaling
watch -n 5 'gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="table(status.conditions[0].message)"'
```

---

## Rollback Procedures

### Quick Rollback (Feature Flags)

If issues arise, the fastest rollback is to disable features via environment variables:

```bash
# Disable all new features, fall back to mocks
gcloud run services update $SERVICE_NAME \
  --update-env-vars USE_FIRECRAWL=false,USE_BULL_QUEUE=false,USE_REAL_API=false \
  --region=$REGION \
  --project=$PROJECT_ID

echo "Feature flags disabled. Service will use mock implementations."
echo "This takes effect immediately on new requests."
```

### Service Revision Rollback

If full rollback is needed:

```bash
# List recent service revisions
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='table(metadata.generation, status.conditions[0].message)'

# Route traffic to previous revision (replace with actual revision name)
gcloud run services update-traffic $SERVICE_NAME \
  --to-revisions=vistralai-00002=100 \
  --region=$REGION \
  --project=$PROJECT_ID

echo "Traffic routed to previous revision"
```

### Full Infrastructure Rollback

If Redis or Firecrawl needs to be removed:

```bash
# Delete Firecrawl service
gcloud run services delete $FIRECRAWL_SERVICE \
  --region=$REGION \
  --project=$PROJECT_ID

# Delete Redis instance
gcloud redis instances delete $REDIS_INSTANCE \
  --region=$REGION \
  --project=$PROJECT_ID

# Redeploy VistralAI with old configuration (no features)
gcloud run services update $SERVICE_NAME \
  --update-env-vars USE_FIRECRAWL=false,USE_BULL_QUEUE=false,USE_REAL_API=false \
  --region=$REGION \
  --project=$PROJECT_ID

echo "Full rollback complete. Service reverted to MVP configuration."
```

---

## Troubleshooting

### Service Won't Start

**Symptom**: Cloud Run deployment fails or service shows unhealthy

**Solution**:
```bash
# Check recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
  --limit 50 \
  --format json \
  --project=$PROJECT_ID | jq '.[] | select(.severity=="ERROR")'

# Check environment variables
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(spec.template.spec.containers[0].env)'

# Verify secrets exist
gcloud secrets list --project=$PROJECT_ID
```

### Redis Connection Errors

**Symptom**: "Connection refused" or "ECONNREFUSED" errors

**Solution**:
```bash
# Verify Redis instance is running
gcloud redis instances describe $REDIS_INSTANCE \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(state)'

# Check VPC connector status
gcloud compute networks vpc-access connectors describe $VPC_CONNECTOR \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(state)'

# If connector is not READY, wait a few more minutes
echo "VPC Connector status is critical for Redis connectivity"
```

### Firecrawl Service Not Responding

**Symptom**: Crawl jobs timeout or return connection errors

**Solution**:
```bash
# Check Firecrawl service is running
gcloud run services describe $FIRECRAWL_SERVICE \
  --region=$REGION \
  --project=$PROJECT_ID

# Check Firecrawl logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$FIRECRAWL_SERVICE" \
  --limit 50 \
  --project=$PROJECT_ID

# Verify network connectivity from VistralAI to Firecrawl
# (This requires a test job - check from Cloud Run logs)
```

### High Memory or CPU Usage

**Symptom**: Services crash due to resource limits

**Solution**:
```bash
# Increase memory/CPU
gcloud run services update $SERVICE_NAME \
  --memory=4Gi \
  --cpu=2 \
  --region=$REGION \
  --project=$PROJECT_ID

# Monitor resource usage
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
  --project=$PROJECT_ID
```

### Secrets Not Being Read

**Symptom**: "Secret not found" or "Permission denied" errors

**Solution**:
```bash
# Verify secrets exist
gcloud secrets list --project=$PROJECT_ID

# Check service account has access
SERVICE_ACCOUNT="${PROJECT_ID}-compute@developer.gserviceaccount.com"

gcloud secrets get-iam-policy nextauth-secret \
  --project=$PROJECT_ID

# Grant access if needed
gcloud secrets add-iam-policy-binding nextauth-secret \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

---

## Cost Optimization

### Monitor Costs

```bash
# View Cloud Run costs
gcloud billing budgets list --project=$PROJECT_ID

# Check current usage
gcloud compute instances list --project=$PROJECT_ID
gcloud redis instances list --region=$REGION --project=$PROJECT_ID
```

### Cost-Saving Strategies

1. **Minimize Min Instances**: Keep at 0 for development, increase only for production traffic
2. **Optimize Memory**: Start with 2Gi, reduce to 1Gi if not needed
3. **Scaling Limits**: Adjust max-instances based on expected load
4. **Schedule-based Scaling**: Use Cloud Scheduler to adjust resource limits by time of day
5. **Monitor API Costs**: Track Claude API and Firecrawl usage

```bash
# Reduce VistralAI memory for testing
gcloud run services update $SERVICE_NAME \
  --memory=1Gi \
  --cpu=1 \
  --region=$REGION \
  --project=$PROJECT_ID
```

---

## Deployment Checklist

Final verification before considering deployment complete:

- [ ] VistralAI service is running and accessible
- [ ] Firecrawl service is deployed and responding
- [ ] Redis instance is online and accessible
- [ ] VPC connector is READY
- [ ] All secrets are created and accessible
- [ ] IAM permissions are configured correctly
- [ ] Cloud Logging is capturing events
- [ ] Monitoring dashboards are set up
- [ ] Alert policies are configured
- [ ] NEXTAUTH_URL matches actual service URL
- [ ] Feature flags are enabled (USE_FIRECRAWL=true, etc.)
- [ ] Full onboarding flow tested end-to-end
- [ ] No errors in recent logs
- [ ] Service scales correctly under load

---

## Next Steps

After successful deployment:

1. **Monitoring**: Check dashboards hourly for first 24 hours
2. **Alerts**: Monitor email/notifications for any alerts
3. **Performance**: Collect baseline metrics for latency, errors, costs
4. **Documentation**: Update team docs with actual service URLs
5. **Backup**: Configure automated backups for critical data
6. **Logging**: Set up error tracking (Sentry if desired)

---

## Support & Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis)
- [VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Firecrawl Documentation](https://www.firecrawl.dev)

---

**Last Updated**: November 2024
**Deployment Status**: Production Ready
**Support Contact**: DevOps Team
