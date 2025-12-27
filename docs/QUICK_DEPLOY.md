# Quick Deploy to Cloud Run

## 🚀 One-Command Deployment

```bash
./deploy.sh
```

That's it! The script will handle everything.

## Prerequisites Check

Before deploying, ensure you have:

- [ ] Google Cloud account with billing enabled
- [ ] `gcloud` CLI installed ([Install here](https://cloud.google.com/sdk/docs/install))
- [ ] Active GCP project set

### Quick Setup

```bash
# Install gcloud (macOS)
brew install --cask google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Deploy!
./deploy.sh
```

## What the Script Does

1. ✅ Verifies GCP project configuration
2. ✅ Enables required Google Cloud APIs
3. ✅ Creates NEXTAUTH_SECRET in Secret Manager
4. ✅ Builds Docker image using Cloud Build
5. ✅ Deploys to Cloud Run
6. ✅ Displays your live service URL

## Expected Output

```
🚀 VistralAI Cloud Run Deployment
=========================================
✓ Project ID: your-project-id
✓ NEXTAUTH_SECRET created
✓ APIs enabled
✓ Image built successfully
✓ Deployment successful!
=========================================

Service URL: https://vistralai-abc123-uc.a.run.app

Demo Account:
  Email: demo@vistralai.com
  Password: demo123
```

## After Deployment

1. **Visit your URL** - Click the Service URL to open VistralAI
2. **Login** - Use demo credentials: `demo@vistralai.com` / `demo123`
3. **Test** - Verify all features work correctly

## Cost Estimate

Free tier covers most small apps:
- **2 million requests/month** - FREE
- **180,000 vCPU-seconds/month** - FREE
- **360,000 GiB-seconds/month** - FREE

**Low traffic app** (10k requests/month) = **~$0.00** (within free tier)

## Troubleshooting

### "gcloud: command not found"
```bash
# Install gcloud CLI first
brew install --cask google-cloud-sdk  # macOS
# Or visit: https://cloud.google.com/sdk/docs/install
```

### "No project set"
```bash
gcloud config set project YOUR_PROJECT_ID
```

### "Permission denied: ./deploy.sh"
```bash
chmod +x deploy.sh
./deploy.sh
```

### Deployment fails
```bash
# Check logs
gcloud builds list --limit 5
gcloud builds log BUILD_ID
```

## Manual Deployment

If you prefer step-by-step control, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Update Deployment

To deploy updates:

```bash
# Make your changes, then redeploy
./deploy.sh
```

## Need Help?

- Full documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Cloud Run docs: https://cloud.google.com/run/docs
- Support: Check logs with `gcloud run logs read vistralai --region us-central1`

---

**Ready to deploy? Run `./deploy.sh` now!**
