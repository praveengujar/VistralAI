# GCP Deployment Plan - MVP Cost-Optimized

> **Last Updated:** January 2026
> **Status:** Ready for Implementation

## Selected Configuration

| Component | Choice | Monthly Cost |
|-----------|--------|--------------|
| **Compute** | Cloud Run (scale-to-zero) | $0-30 |
| **Database** | MongoDB Atlas M0 (Free) | $0 |
| **Cache** | Upstash Redis (Free tier) | $0 |
| **Firecrawl** | External API (firecrawl.dev) | $0 |
| **Domain** | Custom domain with SSL | $0 |
| **Secrets** | GCP Secret Manager | ~$0.50 |
| **Initial Total** | | **~$0-30/mo** |

---

## Requirements

1. Cost-optimized for MVP launch
2. Managed MongoDB (no self-management)
3. Separate config file for cloud deployment (.env.local stays for local dev)
4. Firecrawl: External API for MVP (switch to self-hosted at scale)

---

## 1. MongoDB & Redis: GCP-Native vs Third-Party Comparison

### MongoDB Options

| Option | Service | Min Cost | Pros | Cons |
|--------|---------|----------|------|------|
| **MongoDB Atlas** | Third-party | $0 (M0) | Free tier, MongoDB-native, easy setup, GCP-hosted option | Extra vendor, IP whitelisting for Cloud Run |
| **Firestore** | GCP Native | $0 (free tier) | Native GCP, auto-scaling, no IP config | NOT MongoDB - requires code changes, different query syntax |
| **Cloud SQL PostgreSQL** | GCP Native | ~$10/mo | Native GCP, VPC native | NOT MongoDB - requires Prisma schema migration |

**Why Atlas over GCP-native:**
- Your app uses **Prisma with MongoDB adapter** - Firestore/PostgreSQL would require schema migration
- Atlas M0 runs **on GCP infrastructure** (us-central1) - same region as Cloud Run
- Free tier available; GCP has no free MongoDB equivalent

---

### Redis Options

| Option | Service | Min Cost | Pros | Cons |
|--------|---------|----------|------|------|
| **Upstash Redis** | Third-party | $0 (free tier) | Serverless, free tier, REST API, global | Per-request pricing at scale |
| **Cloud Memorystore** | GCP Native | ~$30/mo | Native GCP, VPC-native, low latency | **No free tier**, requires VPC connector |
| **Redis Cloud** | Third-party | $0 (free tier) | Free tier, managed | Extra vendor |

**Cost Comparison:**

| Scenario | Upstash | Cloud Memorystore |
|----------|---------|-------------------|
| MVP (low traffic) | $0 | ~$30-40/mo |
| Medium traffic | ~$10/mo | ~$30-40/mo |
| High traffic | ~$50+/mo | ~$30-40/mo (fixed) |

**Why Upstash over Memorystore:**
1. **Cost**: Memorystore minimum is ~$30/mo even with zero traffic
2. **Complexity**: Memorystore requires VPC connector setup ($$$)
3. **Free tier**: Upstash has 10,000 commands/day free

---

### When to Choose GCP-Native Services

**Choose Cloud Memorystore (Redis) if:**
- You need <1ms latency (VPC-native)
- High, consistent traffic (fixed cost becomes cheaper)
- Enterprise compliance requires single-vendor
- Already have VPC connector for other services

**Choose Firestore/Cloud SQL if:**
- Starting a new project (no existing MongoDB schema)
- Want tightest GCP integration
- Need Firestore's real-time sync features

---

### Recommended Approach for MVP

**Start with third-party free tiers, migrate to GCP-native when:**
1. Traffic justifies fixed Memorystore cost (~$30/mo)
2. Enterprise customer requires single-vendor
3. Need VPC-native latency (<1ms)

| Service | MVP Phase | Scale Phase |
|---------|-----------|-------------|
| Database | Atlas M0 (free) | Atlas M2 ($9) or M10 ($57) |
| Cache | Upstash (free) | Memorystore (if latency-critical) |

---

## 2. MongoDB Atlas Setup

| Tier | Storage | Cost | Best For |
|------|---------|------|----------|
| **M0 (Free)** | 512MB | $0 | MVP testing ✓ |
| **M2 (Shared)** | 2GB | $9/mo | Production MVP |
| **M10 (Dedicated)** | 10GB | $57/mo | Scale phase |

**Setup Steps:**
1. Create Atlas cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Choose GCP / us-central1 for co-location with Cloud Run
3. Whitelist `0.0.0.0/0` (Cloud Run has dynamic IPs) or use VPC peering
4. Copy connection string for Secret Manager

---

## 3. Configuration Strategy

### File Structure
```
.env.local              # Local development (exists, keep as-is)
.env.production         # Production config (create new)
.env.production.example # Template for production (update existing)
```

### New File: `.env.production`
```bash
# === DEPLOYMENT MODE ===
NODE_ENV=production

# === AUTH ===
NEXTAUTH_URL=https://app.vistralai.com
# NEXTAUTH_SECRET loaded from Secret Manager

# === DATABASE ===
DATABASE_MODE=mongodb
# DATABASE_URL loaded from Secret Manager (Atlas connection string)

# === CACHE ===
# REDIS_URL loaded from Secret Manager (Upstash connection string)

# === AI/LLM ===
# OPENAI_API_KEY loaded from Secret Manager
OPENAI_MODEL=gpt-4o-mini
USE_REAL_API=true

# === FIRECRAWL ===
USE_FIRECRAWL=true
# FIRECRAWL_API_KEY loaded from Secret Manager

# === PAYMENTS ===
# STRIPE_SECRET_KEY loaded from Secret Manager
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY set directly (public key OK)

# === LIMITS ===
FIRECRAWL_MAX_PAGES=20
FIRECRAWL_MAX_DEPTH=2
CONFIDENCE_THRESHOLD=0.85
```

### Secret Manager Keys to Create
```bash
gcloud secrets create NEXTAUTH_SECRET --data-file=-
gcloud secrets create DATABASE_URL --data-file=-
gcloud secrets create REDIS_URL --data-file=-
gcloud secrets create OPENAI_API_KEY --data-file=-
gcloud secrets create FIRECRAWL_API_KEY --data-file=-
gcloud secrets create STRIPE_SECRET_KEY --data-file=-
gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
```

---

## 4. Firecrawl: Self-Hosted vs External API

### Option A: External Firecrawl API (SELECTED for MVP)

**Pricing:** https://firecrawl.dev/pricing
- Free: 500 credits/month
- Hobby: $19/mo for 3,000 credits
- Standard: $99/mo for 100,000 credits

**Pros:**
- Zero infrastructure to manage
- No Playwright/PostgreSQL/RabbitMQ costs
- Scales automatically
- Better uptime (managed SLA)
- Faster deployment
- **Saves ~$25-50/month** in Cloud Run costs

**Cons:**
- Per-credit pricing (1 credit = 1 page scraped)
- Rate limits on free/hobby tiers
- External dependency
- Data leaves your infrastructure

**Implementation:**
```typescript
// Update lib/config/firecrawl.ts
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
```

---

### Option B: Self-Hosted Firecrawl on Cloud Run

**Monthly Cost Estimate:**
| Service | Specs | Cost |
|---------|-------|------|
| firecrawl-api | 1 vCPU, 1GB | ~$10-20 |
| firecrawl-playwright | 1 vCPU, 2GB | ~$15-25 |
| Cloud SQL PostgreSQL | db-f1-micro | ~$10 |
| **Total** | | **~$35-55** |

**Pros:**
- Unlimited crawls (no per-page cost)
- Data stays in your infrastructure
- Full control over configuration
- No rate limits

**Cons:**
- Higher base cost even with zero traffic
- More infrastructure to manage
- Playwright service is memory-heavy
- Cold starts affect crawl latency
- Need to maintain Firecrawl updates

---

### Recommendation

For MVP, use **Firecrawl External API**:
1. 500 free credits/month covers initial testing
2. Upgrade to $19/mo Hobby tier for launch
3. Switch to self-hosted when reaching >3,000 pages/month

**Break-even point:** ~5,000-10,000 pages/month

---

## 5. Custom Domain Setup

### Prerequisites
- Own a domain (e.g., `app.vistralai.com`)
- Access to DNS management

### Steps

**1. Verify Domain Ownership**
```bash
gcloud domains verify app.vistralai.com
```

**2. Map Domain to Cloud Run**
```bash
gcloud run domain-mappings create \
  --service=vistralai \
  --domain=app.vistralai.com \
  --region=us-central1
```

**3. Configure DNS Records**
Cloud Run will provide DNS records to add:
```
Type: A     Record: @              Value: <Cloud Run IP>
Type: AAAA  Record: @              Value: <Cloud Run IPv6>
Type: CNAME Record: www            Value: ghs.googlehosted.com.
```

**4. Update NEXTAUTH_URL**
```bash
# In Secret Manager or .env.production
NEXTAUTH_URL=https://app.vistralai.com
```

**5. Wait for SSL Certificate**
- Google-managed SSL auto-provisioned (15-30 min)
- Verify: `gcloud run domain-mappings describe --domain=app.vistralai.com`

---

## 6. Implementation Checklist

### Phase 1: External Services Setup (~30 min)
- [ ] Create MongoDB Atlas account → M0 Free cluster → GCP/us-central1
- [ ] Whitelist IP `0.0.0.0/0` for Cloud Run access
- [ ] Copy Atlas connection string
- [ ] Create Upstash Redis database → Copy connection string
- [ ] Get Firecrawl API key from firecrawl.dev

### Phase 2: GCP Secrets (~15 min)
```bash
# Create secrets
echo -n "your-atlas-connection-string" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-upstash-redis-url" | gcloud secrets create REDIS_URL --data-file=-
echo -n "your-openai-key" | gcloud secrets create OPENAI_API_KEY --data-file=-
echo -n "your-firecrawl-key" | gcloud secrets create FIRECRAWL_API_KEY --data-file=-
echo -n "your-stripe-secret" | gcloud secrets create STRIPE_SECRET_KEY --data-file=-
openssl rand -base64 32 | gcloud secrets create NEXTAUTH_SECRET --data-file=-
```

### Phase 3: Configuration Files (~20 min)
- [ ] Create `.env.production` with non-secret values
- [ ] Update `cloudbuild.yaml` to reference secrets
- [ ] Update `lib/config/firecrawl.ts` for external API mode
- [ ] Update `FirecrawlService.ts` to use API key auth

### Phase 4: Deploy (~15 min)
```bash
gcloud builds submit --config=cloudbuild.yaml
```

### Phase 5: Custom Domain (~30 min)
- [ ] Run domain mapping command
- [ ] Add DNS records
- [ ] Wait for SSL provisioning
- [ ] Update NEXTAUTH_URL secret

### Phase 6: Verify (~15 min)
- [ ] Test authentication flow
- [ ] Test Magic Import (Firecrawl)
- [ ] Test Stripe payment flow
- [ ] Configure Stripe webhook to new URL

---

## 7. Files to Modify

| File | Changes |
|------|---------|
| `.env.production` | Create new (production config) |
| `cloudbuild.yaml` | Add MongoDB Atlas, Upstash, Firecrawl API secrets |
| `lib/config/firecrawl.ts` | Add external API support with API key auth |
| `lib/services/crawler/FirecrawlService.ts` | Support both internal URL and external API |
| `deploy.sh` | Update for new secret structure |

---

## 8. Cost Comparison Summary

| Approach | Monthly Cost | Complexity |
|----------|--------------|------------|
| **Selected (External Firecrawl)** | ~$0-30 | Low |
| Self-hosted Firecrawl | ~$35-85 | Medium |
| Full self-hosted (MongoDB too) | ~$50-120 | High |

---

## 9. Upgrade Path

When traffic grows:

| Service | Trigger | Action | Additional Cost |
|---------|---------|--------|-----------------|
| MongoDB | 512MB usage | Atlas M0 → M2 | +$9/mo |
| Firecrawl | >500 pages/mo | Free → Hobby | +$19/mo |
| Redis | 10K commands/day | Free → Pay-as-you-go | ~$5-10/mo |
| Redis | Need <1ms latency | Upstash → Memorystore | ~$30/mo |
| Firecrawl | >3000 pages/mo | External → Self-hosted | Variable |

---

**Total Time to Deploy:** ~2 hours
