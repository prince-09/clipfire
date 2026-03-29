import dotenv from 'dotenv';
dotenv.config();

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const username = encodeURIComponent(process.env.MONGODB_USERNAME || '');
  const password = encodeURIComponent(process.env.MONGODB_PASSWORD || '');
  const host = process.env.MONGODB_HOST || 'cluster0.uw9b9d6.mongodb.net';
  const dbName = process.env.MONGODB_DB || 'content_repurpose';

  if (username && password && host.includes('mongodb.net')) {
    return `mongodb+srv://${username}:${password}@${host}/${dbName}?retryWrites=true&w=majority`;
  }

  if (username && password) {
    return `mongodb://${username}:${password}@${host}/${dbName}`;
  }

  return `mongodb://${host}/${dbName}`;
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: buildDatabaseUrl(),
  openrouterApiKey: process.env.OPENROUTER_API_KEY!,
  openrouterBaseUrl: 'https://openrouter.ai/api/v1',
  // Free model for clip detection / text analysis
  llmModel: process.env.LLM_MODEL || 'mistralai/mistral-7b-instruct:free',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  gumroadProductId: process.env.GUMROAD_PRODUCT_ID || '',
  clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
  s3: {
    bucket: process.env.S3_BUCKET || 'content-repurpose',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
  },
};
