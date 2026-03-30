# Backend Deployment — GCP Cloud Run

## Prerequisites

- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed (`brew install google-cloud-sdk`)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (free tier works)
- GCP project created

## One-Time Setup

Run from **anywhere** (these are global gcloud commands):

```bash
# Login & set project
gcloud auth login
gcloud config set project clipfire

# Enable APIs
gcloud services enable run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# Create Docker repo
gcloud artifacts repositories create clipfire-491718 \
  --repository-format=docker \
  --location=us-central1
```

### Create Secrets (reads from .env automatically)

Run from **`backend/`** folder:

```bash
# Load values from .env, then create each secret
source .env

echo -n "$MONGODB_USERNAME" | gcloud secrets create MONGODB_USERNAME --data-file=-
echo -n "$MONGODB_PASSWORD" | gcloud secrets create MONGODB_PASSWORD --data-file=-
echo -n "$OPENAI_API_KEY" | gcloud secrets create OPENAI_API_KEY --data-file=-
echo -n "$CLERK_SECRET_KEY" | gcloud secrets create CLERK_SECRET_KEY --data-file=-
echo -n "$CLERK_PUBLISHABLE_KEY" | gcloud secrets create CLERK_PUBLISHABLE_KEY --data-file=-
echo -n "$GUMROAD_PRODUCT_ID" | gcloud secrets create GUMROAD_PRODUCT_ID --data-file=-
```

### Grant Cloud Run Access to Secrets

Run from **anywhere**:

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

for SECRET in MONGODB_USERNAME MONGODB_PASSWORD OPENAI_API_KEY CLERK_SECRET_KEY CLERK_PUBLISHABLE_KEY GUMROAD_PRODUCT_ID; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

## Deploy

Run from **`backend/`** folder:

```bash
# Build TypeScript
npm run build

# Build & push Docker image
gcloud builds submit --tag us-central1-docker.pkg.dev/clipfire-491718/clipfire-491718/backend:latest .

# Deploy to Cloud Run
gcloud run deploy clipfire-backend \
  --image us-central1-docker.pkg.dev/clipfire-491718/clipfire-491718/backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --max-instances 3 \
  --set-env-vars "NODE_ENV=production,MONGODB_HOST=cluster0.uw9b9d6.mongodb.net,MONGODB_DB=content_repurpose,FRONTEND_URL=https://your-frontend-url.com" \
  --set-secrets "MONGODB_USERNAME=MONGODB_USERNAME:latest,MONGODB_PASSWORD=MONGODB_PASSWORD:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,CLERK_SECRET_KEY=CLERK_SECRET_KEY:latest,CLERK_PUBLISHABLE_KEY=CLERK_PUBLISHABLE_KEY:latest,GUMROAD_PRODUCT_ID=GUMROAD_PRODUCT_ID:latest"
```

## Quick Deploy (after first setup)

Run from **`backend/`** folder:

```bash
npm run build && \
gcloud builds submit --tag us-central1-docker.pkg.dev/clipfire-491718/clipfire-491718/backend:latest . && \
gcloud run deploy clipfire-backend \
  --image us-central1-docker.pkg.dev/clipfire-491718/clipfire-491718/backend:latest \
  --region us-central1 --platform managed --allow-unauthenticated \
  --memory 2Gi --cpu 2 --timeout 3600 --max-instances 3 \
  --set-env-vars "NODE_ENV=production,MONGODB_HOST=cluster0.uw9b9d6.mongodb.net,MONGODB_DB=content_repurpose,FRONTEND_URL=https://your-frontend-url.com" \
  --set-secrets "MONGODB_USERNAME=MONGODB_USERNAME:latest,MONGODB_PASSWORD=MONGODB_PASSWORD:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,CLERK_SECRET_KEY=CLERK_SECRET_KEY:latest,CLERK_PUBLISHABLE_KEY=CLERK_PUBLISHABLE_KEY:latest,GUMROAD_PRODUCT_ID=GUMROAD_PRODUCT_ID:latest"
```

## Update Secrets

Run from **`backend/`** folder (update .env first, then re-run):

```bash
# Update a single secret (edit .env first, then run)
source .env
echo -n "$SECRET_NAME" | gcloud secrets versions add SECRET_NAME --data-file=-

# Or re-sync all from .env
source .env
echo -n "$MONGODB_USERNAME" | gcloud secrets versions add MONGODB_USERNAME --data-file=-
echo -n "$MONGODB_PASSWORD" | gcloud secrets versions add MONGODB_PASSWORD --data-file=-
echo -n "$OPENAI_API_KEY" | gcloud secrets versions add OPENAI_API_KEY --data-file=-
echo -n "$CLERK_SECRET_KEY" | gcloud secrets versions add CLERK_SECRET_KEY --data-file=-
echo -n "$CLERK_PUBLISHABLE_KEY" | gcloud secrets versions add CLERK_PUBLISHABLE_KEY --data-file=-
echo -n "$GUMROAD_PRODUCT_ID" | gcloud secrets versions add GUMROAD_PRODUCT_ID --data-file=-
# Then redeploy (Cloud Run picks up "latest" on next deploy)
```

## Useful Commands

Run from **anywhere**:

```bash
# View logs
gcloud run services logs read clipfire-backend --region us-central1

# Get service URL
gcloud run services describe clipfire-backend --region us-central1 --format='value(status.url)'

# Check status
gcloud run services describe clipfire-backend --region us-central1

# Delete service
gcloud run services delete clipfire-backend --region us-central1
```

## CI/CD (auto-deploy on git push)

Run from **anywhere**:

```bash
gcloud builds triggers create github \
  --repo-name=content-repurpose \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=backend/cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_REPO=clipfire
```

## Notes

- Cloud Run scales to zero when idle — pay only when processing
- `--timeout 3600` allows up to 60 min per request (for long videos)
- `--max-instances 3` caps costs during MVP
- Storage uses GCS in production (configured via `@google-cloud/storage`)
- MongoDB URL is built from `MONGODB_USERNAME` + `MONGODB_PASSWORD` + `MONGODB_HOST` in `config.ts` — no need to pass a full connection string
