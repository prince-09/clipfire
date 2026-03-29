import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

// Set DATABASE_URL for Prisma (built from MONGODB_USERNAME/PASSWORD if not set directly)
process.env.DATABASE_URL = config.databaseUrl;

export const prisma = new PrismaClient();
