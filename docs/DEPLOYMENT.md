# VistralAI - Cloud Run Deployment Guide

This guide will help you deploy VistralAI to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: You need a GCP account with billing enabled
2. **Google Cloud SDK**: Install the `gcloud` CLI tool
3. **Docker**: Installed locally (optional, for local testing)
4. **Git**: For version control

## Quick Deployment

### Option 1: Automated Deployment Script (Recommended)

The easiest way to deploy VistralAI:

```bash
./deploy.sh
```

The script will:
- ✅ Verify your GCP project
- ✅ Enable required APIs
- ✅ Create secrets in Secret Manager
- ✅ Build Docker image
- ✅ Deploy to Cloud Run
- ✅ Display your service URL

### Option 2: Manual Deployment

If you prefer manual control:

#### Step 1: Set Up GCP Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

#### Step 2: Create Secrets

```bash
# Generate NEXTAUTH_SECRET
export NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create secret in Secret Manager
echo -n "$NEXTAUTH_SECRET" | gcloud secrets create nextauth-secret \
  --data-file=- \
  --replication-policy="automatic"
```

#### Step 3: Build and Push Docker Image

```bash
# Build the image
gcloud builds submit --tag gcr.io/$PROJECT_ID/vistralai

# Or build locally and push
docker build -t gcr.io/$PROJECT_ID/vistralai .
docker push gcr.io/$PROJECT_ID/vistralai
```

#### Step 4: Deploy to Cloud Run

```bash
gcloud run deploy vistralai \
  --image gcr.io/$PROJECT_ID/vistralai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,NEXTAUTH_URL=https://vistralai-XXXXX.run.app \
  --set-secrets NEXTAUTH_SECRET=nextauth-secret:latest
```

#### Step 5: Update NEXTAUTH_URL

After deployment, get your service URL and update the environment variable:

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe vistralai \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')

# Update NEXTAUTH_URL
gcloud run services update vistralai \
  --update-env-vars NEXTAUTH_URL=$SERVICE_URL \
  --region us-central1
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production) | Yes |
| `NEXTAUTH_URL` | Full URL of your deployment | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT signing (from Secret Manager) | Yes |

### Cloud Run Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Memory | 1Gi | Adjust based on traffic |
| CPU | 1 | Number of CPUs |
| Min Instances | 0 | Scale to zero when idle |
| Max Instances | 10 | Maximum concurrent instances |
| Region | us-central1 | Choose nearest region |

## Continuous Deployment with Cloud Build

### Option 1: Using Cloud Build Triggers

1. **Connect Repository**:
   ```bash
   # Connect your GitHub/GitLab/Bitbucket repo
   gcloud alpha builds triggers create github \
     --repo-name=vistralai \
     --repo-owner=YOUR_USERNAME \
     --branch-pattern=^main$ \
     --build-config=cloudbuild.yaml
   ```

2. **Every push to main will automatically deploy**

### Option 2: Manual Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_NEXTAUTH_URL=https://your-url.run.app
```

## Post-Deployment Steps

### 1. Test Your Deployment

Visit your Cloud Run URL and verify:
- ✅ Login page loads
- ✅ Can login with demo account: `demo@vistralai.com` / `demo123`
- ✅ Dashboard displays correctly
- ✅ All navigation works

### 2. Set Up Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service vistralai \
  --domain app.yourdomain.com \
  --region us-central1
```

Follow DNS instructions to point your domain.

### 3. Configure Monitoring

```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

View logs:
```bash
gcloud run logs read vistralai --region us-central1
```

## Updating the Application

### Quick Update

```bash
# Make your code changes, then redeploy
./deploy.sh
```

### Or Manually

```bash
# Rebuild and redeploy
gcloud builds submit --tag gcr.io/$PROJECT_ID/vistralai
gcloud run deploy vistralai --image gcr.io/$PROJECT_ID/vistralai --region us-central1
```

## Cost Optimization

Cloud Run pricing is pay-per-use. To optimize costs:

1. **Set min-instances to 0**: Scale to zero when idle
2. **Use appropriate memory**: Start with 1Gi, adjust if needed
3. **Set max-instances**: Prevent runaway costs
4. **Enable CPU allocation**: Only allocate during requests

### Estimated Costs (Low Traffic)

- Free tier: 2 million requests/month
- Compute: ~$0.00002400 per vCPU-second
- Memory: ~$0.00000250 per GiB-second
- Requests: $0.40 per million requests

**Example**: Small app with 10k requests/month ≈ **FREE** (within free tier)

## Troubleshooting

### Issue: "Service URL doesn't work"

Check if NEXTAUTH_URL matches your service URL:
```bash
gcloud run services describe vistralai --region us-central1 --format='get(status.url)'
```

Update if needed:
```bash
gcloud run services update vistralai \
  --update-env-vars NEXTAUTH_URL=https://your-actual-url.run.app \
  --region us-central1
```

### Issue: "Build failed"

Check build logs:
```bash
gcloud builds list --limit 5
gcloud builds log BUILD_ID
```

### Issue: "Authentication not working"

Verify secret exists:
```bash
gcloud secrets describe nextauth-secret
```

Recreate if needed:
```bash
echo -n "$(openssl rand -base64 32)" | gcloud secrets create nextauth-secret-new --data-file=-
```

### Issue: "Out of memory"

Increase memory allocation:
```bash
gcloud run services update vistralai \
  --memory 2Gi \
  --region us-central1
```

## Security Best Practices

1. **Use Secret Manager**: Never hardcode secrets
2. **Enable HTTPS**: Cloud Run uses HTTPS by default
3. **Set Security Headers**: Already configured in next.config.js
4. **Limit Access**: Use `--no-allow-unauthenticated` for internal apps
5. **Regular Updates**: Keep dependencies updated

## Monitoring & Observability

### View Metrics

```bash
# Service metrics
gcloud run services describe vistralai --region us-central1 --format='get(status.traffic)'

# View logs
gcloud run logs read vistralai --region us-central1 --limit 50
```

### Set Up Alerts

Configure alerts in Cloud Console:
- Error rate threshold
- Response time threshold
- Memory usage threshold
- Request count anomalies

## Scaling Configuration

### For High Traffic

```bash
gcloud run services update vistralai \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 100 \
  --region us-central1
```

### For Development

```bash
gcloud run services update vistralai \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --region us-central1
```

## Rollback

If a deployment fails:

```bash
# List revisions
gcloud run revisions list --service vistralai --region us-central1

# Rollback to previous revision
gcloud run services update-traffic vistralai \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

## Clean Up

To delete the service:

```bash
gcloud run services delete vistralai --region us-central1
gcloud container images delete gcr.io/$PROJECT_ID/vistralai
gcloud secrets delete nextauth-secret
```

## Support

For issues:
- Check logs: `gcloud run logs read vistralai --region us-central1`
- Cloud Run documentation: https://cloud.google.com/run/docs
- Cloud Build documentation: https://cloud.google.com/build/docs

---

**VistralAI on Cloud Run** - Scalable, serverless, and cost-effective deployment
