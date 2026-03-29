/**
 * Sets DATABASE_URL from MONGODB_USERNAME/PASSWORD if not already set,
 * then runs `prisma db push`.
 */
import { config } from './config.js';
import { execSync } from 'child_process';

process.env.DATABASE_URL = config.databaseUrl;
console.log('DATABASE_URL set. Running prisma db push...');
execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
