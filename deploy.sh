#!/bin/bash

# VistralAI - Cloud Run Deployment Script
# This script handles deployment to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="vistralai"
REGION="us-central1"
MEMORY="1Gi"
CPU="1"
MIN_INSTANCES="0"
MAX_INSTANCES="10"

echo -e "${GREEN}🚀 VistralAI Cloud Run Deployment${NC}"
echo "========================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project set${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓ Project ID: ${PROJECT_ID}${NC}"

# Prompt for deployment URL
echo ""
read -p "Enter your deployment URL (e.g., https://vistralai-xyz.run.app): " NEXTAUTH_URL

if [ -z "$NEXTAUTH_URL" ]; then
    echo -e "${YELLOW}Warning: No URL provided. Using placeholder.${NC}"
    NEXTAUTH_URL="https://${APP_NAME}-placeholder.run.app"
fi

# Check if NEXTAUTH_SECRET exists in Secret Manager
echo ""
echo -e "${YELLOW}Checking for NEXTAUTH_SECRET in Secret Manager...${NC}"

if ! gcloud secrets describe nextauth-secret --project=$PROJECT_ID &>/dev/null; then
    echo -e "${YELLOW}Creating NEXTAUTH_SECRET...${NC}"

    # Generate a random secret
    NEXTAUTH_SECRET=$(openssl rand -base64 32)

    # Create secret
    echo -n "$NEXTAUTH_SECRET" | gcloud secrets create nextauth-secret \
        --data-file=- \
        --replication-policy="automatic" \
        --project=$PROJECT_ID

    echo -e "${GREEN}✓ NEXTAUTH_SECRET created${NC}"
else
    echo -e "${GREEN}✓ NEXTAUTH_SECRET already exists${NC}"
fi

# Enable required APIs
echo ""
echo -e "${YELLOW}Enabling required Google Cloud APIs...${NC}"
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    --project=$PROJECT_ID

echo -e "${GREEN}✓ APIs enabled${NC}"

# Build and deploy
echo ""
echo -e "${YELLOW}Building Docker image...${NC}"

# Build the image
gcloud builds submit \
    --tag gcr.io/${PROJECT_ID}/${APP_NAME} \
    --project=$PROJECT_ID \
    .

echo -e "${GREEN}✓ Image built successfully${NC}"

# Deploy to Cloud Run
echo ""
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"

gcloud run deploy ${APP_NAME} \
    --image gcr.io/${PROJECT_ID}/${APP_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory ${MEMORY} \
    --cpu ${CPU} \
    --min-instances ${MIN_INSTANCES} \
    --max-instances ${MAX_INSTANCES} \
    --set-env-vars NODE_ENV=production,NEXTAUTH_URL=${NEXTAUTH_URL} \
    --set-secrets NEXTAUTH_SECRET=nextauth-secret:latest \
    --project=$PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${APP_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)' \
    --project=$PROJECT_ID)

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important: Update your NEXTAUTH_URL${NC}"
echo "If the NEXTAUTH_URL doesn't match the Service URL above, update it:"
echo ""
echo "  gcloud run services update ${APP_NAME} \\"
echo "    --update-env-vars NEXTAUTH_URL=${SERVICE_URL} \\"
echo "    --region ${REGION} \\"
echo "    --project=${PROJECT_ID}"
echo ""
echo -e "${GREEN}Demo Account:${NC}"
echo "  Email: demo@vistralai.com"
echo "  Password: demo123"
echo ""
