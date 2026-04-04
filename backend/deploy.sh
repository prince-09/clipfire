#!/bin/bash
set -e

npm run build

gcloud builds submit \
  --tag us-central1-docker.pkg.dev/clipfire-491718/clipfire-491718/backend:latest .

gcloud run deploy clipfire-backend \
  --image us-central1-docker.pkg.dev/clipfire-491718/clipfire-491718/backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --no-cpu-throttling \
  --timeout 3600 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars "NODE_ENV=production,MONGODB_HOST=cluster0.uw9b9d6.mongodb.net,MONGODB_DB=content_repurpose,FRONTEND_URL=https://clipfire.molevia.com,GCS_BUCKET=clipfire-uploads" \
  --update-secrets "MONGODB_USERNAME=MONGODB_USERNAME:latest,MONGODB_PASSWORD=MONGODB_PASSWORD:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,CLERK_SECRET_KEY=CLERK_SECRET_KEY:latest,CLERK_PUBLISHABLE_KEY=CLERK_PUBLISHABLE_KEY:latest,GUMROAD_PRODUCT_ID=GUMROAD_PRODUCT_ID:latest"
