# Phase 1: Project Foundation & Auth - Research

**Researched:** 2026-03-08
**Domain:** Monorepo scaffolding, JWT authentication, API key encryption, Next.js + Express + Prisma
**Confidence:** HIGH

## Summary

Phase 1 establishes the project foundation: monorepo structure with npm workspaces, Next.js 14 frontend with shadcn/ui, Express backend with Prisma ORM on PostgreSQL, JWT authentication, and AES-256-GCM encrypted API key management for the BYOK model.

The core technical challenges are: (1) correctly configuring the npm workspaces monorepo with shared TypeScript types, (2) implementing secure AES-256-GCM encryption for API keys using Node.js native crypto module, and (3) building API key validation that tests keys against OpenAI, Anthropic, and Google Gemini endpoints without leaking keys in logs or responses.

**Primary recommendation:** Use Node.js native `crypto` module for AES-256-GCM (no third-party encryption library needed), `jsonwebtoken` + `bcryptjs` for auth (no Passport.js), and a simple zod validation middleware for all Express routes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR-1.1 | Users can register with email and password | Express auth route + bcryptjs hashing + Prisma user creation |
| FR-1.2 | Users can log in and receive a JWT token | jsonwebtoken sign with 7-day expiry |
| FR-1.3 | Protected routes require valid JWT | Express middleware extracting Bearer token, jwt.verify |
| FR-1.4 | Passwords are hashed with bcrypt (min 10 rounds) | bcryptjs with saltRounds=10 |
| FR-1.5 | JWT tokens expire after 7 days | jsonwebtoken `expiresIn: '7d'` option |
| FR-2.1 | Users can add API keys for OpenAI, Anthropic, Google Gemini | CRUD routes + provider enum in Prisma schema |
| FR-2.2 | Keys are validated on save (test API call) | Provider-specific validation: OpenAI /v1/models, Anthropic /v1/messages, Gemini generateContent |
| FR-2.3 | Keys are encrypted with AES-256-GCM before storage | Node.js crypto.createCipheriv with random IV + auth tag |
| FR-2.4 | Keys are never returned in API responses (only masked) | Response serialization strips key, returns `sk-...xxxx` |
| FR-2.5 | Keys are never logged or included in error messages | Key manager service with strict encapsulation |
| FR-2.6 | Users can delete their API keys | DELETE endpoint with ownership check |
| FR-2.7 | At minimum, OpenAI key required for Whisper | Validation logic in processing pipeline (not blocking in Phase 1, but schema supports it) |
| NFR-2.1 | API keys encrypted at rest with AES-256-GCM | Covered by key-manager service pattern |
| NFR-2.3 | JWT authentication on all protected endpoints | Auth middleware applied to route groups |
| NFR-2.4 | Input validation on all API endpoints (zod schemas) | Zod validation middleware for body, params, query |
| NFR-2.6 | CORS restricted to frontend origin | Express cors middleware with origin whitelist |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 14.x | Frontend framework (App Router) | Decided in project stack, RSC support |
| `tailwindcss` | 3.x | Styling | Rapid UI, consistent with shadcn/ui |
| `express` | 4.x | Backend HTTP framework | Decided: unified JS stack over FastAPI |
| `prisma` | 5.x | ORM + migrations | Type-safe, PostgreSQL JSONB support, decided in stack |
| `@prisma/client` | 5.x | Database client | Auto-generated from schema |
| `typescript` | 5.x | Type safety | Shared types across monorepo |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jsonwebtoken` | 9.x | JWT token creation/verification | Auth endpoints (login, middleware) |
| `bcryptjs` | 2.x | Password hashing | Registration, login verification |
| `zod` | 3.x | Runtime validation + type inference | All API endpoint input validation |
| `helmet` | 7.x | Security headers | Express middleware, all routes |
| `cors` | 2.x | CORS configuration | Express middleware, restrict to frontend origin |
| `dotenv` | 16.x | Environment variables | Backend config loading |
| `tsx` | 4.x | TypeScript execution | Backend dev server |
| `@tanstack/react-query` | 5.x | Server state management | Frontend API calls, caching |
| `axios` | 1.x | HTTP client | Frontend-to-backend API calls |
| `react-hot-toast` | 2.x | Toast notifications | User feedback on actions |
| `lucide-react` | latest | Icons | UI icons throughout |
| `zustand` | 4.x | Client state | Lightweight global state |

### shadcn/ui Components Needed for Phase 1
| Component | Purpose |
|-----------|---------|
| `button` | Forms, actions |
| `input` | Text fields (email, password, API key) |
| `label` | Form labels |
| `card` | Settings page cards |
| `dialog` | Add API key modal |
| `select` | Provider dropdown (OpenAI/Anthropic/Gemini) |
| `badge` | Provider badges on key list |
| `toast` | Action confirmations (via sonner or react-hot-toast) |
| `form` | Form wrapper with validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `jsonwebtoken` | `jose` | jose is ESM-native and Web Crypto API-based, but jsonwebtoken is more established with Express |
| `bcryptjs` | `argon2` | argon2 is theoretically stronger but requires native bindings; bcryptjs is pure JS, simpler |
| Custom zod middleware | `express-zod-api` | Full framework is overkill; simple middleware function is sufficient |
| `dotenv` | `@t3-oss/env-nextjs` | t3-env adds validation but is Next.js-specific; dotenv covers backend simply |

**Installation (Backend):**
```bash
npm install express @prisma/client jsonwebtoken bcryptjs zod helmet cors dotenv
npm install -D prisma typescript tsx @types/express @types/jsonwebtoken @types/bcryptjs @types/cors
```

**Installation (Frontend):**
```bash
npx create-next-app@14 --typescript --tailwind --eslint --app --src-dir
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card dialog select badge form
npm install @tanstack/react-query axios react-hot-toast lucide-react zustand
```

## Architecture Patterns

### Recommended Project Structure
```
content-repurpose/
  package.json              # Workspace root: { "workspaces": ["frontend", "backend", "shared"] }
  tsconfig.base.json        # Shared TS config (strict, target ES2022)
  docker-compose.yml        # PostgreSQL + Redis for local dev
  .env.example              # Template for required env vars
  frontend/                 # Next.js 14 app
    package.json            # name: "@repo/frontend"
    tsconfig.json           # extends ../tsconfig.base.json
    next.config.js
    tailwind.config.ts
    src/
      app/
        layout.tsx          # Root layout with providers
        page.tsx            # Landing/redirect to dashboard
        (auth)/
          login/page.tsx
          register/page.tsx
          layout.tsx        # Auth layout (centered, no sidebar)
        (protected)/
          layout.tsx        # Protected layout with auth check
          dashboard/page.tsx
          settings/page.tsx # API key management
      components/
        ui/                 # shadcn/ui components
        auth/               # LoginForm, RegisterForm
        settings/           # ApiKeyList, AddKeyDialog
      lib/
        api-client.ts       # Axios instance with JWT interceptor
        auth.ts             # Token storage, auth helpers
        utils.ts            # cn() helper from shadcn
      hooks/
        use-auth.ts         # Auth state hook
        use-api-keys.ts     # API key CRUD hooks (react-query)
      providers/
        query-provider.tsx  # React Query provider
  backend/                  # Express API
    package.json            # name: "@repo/backend"
    tsconfig.json           # extends ../tsconfig.base.json
    prisma/
      schema.prisma
      migrations/
    src/
      index.ts              # Express app entry point
      routes/
        auth.ts             # POST /register, /login, GET /me
        keys.ts             # GET/POST/DELETE /keys, POST /keys/:id/validate
      middleware/
        auth.ts             # JWT verification middleware
        validate.ts         # Zod validation middleware
        error-handler.ts    # Global error handler (strips sensitive data)
      services/
        key-manager.ts      # AES-256-GCM encrypt/decrypt + masking
        key-validator.ts    # Provider-specific API key testing
      lib/
        prisma.ts           # Prisma client singleton
        config.ts           # Typed config from env vars
  shared/                   # Shared types and schemas
    package.json            # name: "@repo/shared"
    tsconfig.json
    src/
      types/
        auth.ts             # User, LoginRequest, RegisterRequest
        api-keys.ts         # ApiKey, Provider enum, AddKeyRequest
      schemas/
        auth.ts             # Zod schemas for auth validation
        api-keys.ts         # Zod schemas for key validation
      constants.ts          # Provider list, limits
```

### Pattern 1: Monorepo with npm Workspaces
**What:** Root package.json defines workspaces; shared package exports types and zod schemas used by both frontend and backend.
**When to use:** Always -- this is the project structure.
**Example:**
```json
// Root package.json
{
  "name": "content-repurpose",
  "private": true,
  "workspaces": ["frontend", "backend", "shared"],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "dev:frontend": "npm run dev -w frontend",
    "dev:backend": "npm run dev -w backend"
  }
}
```

```json
// shared/package.json
{
  "name": "@repo/shared",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

```json
// backend/package.json
{
  "name": "@repo/backend",
  "dependencies": {
    "@repo/shared": "*"
  }
}
```

### Pattern 2: JWT Auth Middleware
**What:** Express middleware that extracts Bearer token, verifies JWT, attaches user to request.
**When to use:** All protected routes.
**Example:**
```typescript
// backend/src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../lib/config';

interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### Pattern 3: Zod Validation Middleware
**What:** Reusable middleware that validates request body/params/query against zod schemas.
**When to use:** Every API endpoint.
**Example:**
```typescript
// backend/src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req[source] = result.data;
    next();
  };
}
```

### Pattern 4: AES-256-GCM Encryption Service
**What:** Key manager service that encrypts/decrypts API keys using Node.js native crypto.
**When to use:** Storing and retrieving user API keys.
**Example:**
```typescript
// backend/src/services/key-manager.ts
import crypto from 'node:crypto';
import { config } from '../lib/config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;       // 96 bits for GCM
const TAG_LENGTH = 16;      // 128 bits
const ENCODING = 'base64';

// Encryption key must be 32 bytes (256 bits)
// Derived from env var ENCRYPTION_KEY
function getEncryptionKey(): Buffer {
  const key = config.encryptionKey;
  // Use SHA-256 to derive a consistent 32-byte key from any-length secret
  return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const tag = cipher.getAuthTag();

  // Store as: iv:tag:ciphertext (all base64)
  return [
    iv.toString(ENCODING),
    tag.toString(ENCODING),
    encrypted.toString(ENCODING),
  ].join(':');
}

export function decrypt(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(':');

  const iv = Buffer.from(ivB64, ENCODING);
  const tag = Buffer.from(tagB64, ENCODING);
  const encrypted = Buffer.from(dataB64, ENCODING);

  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

export function maskKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 3) + '...' + key.slice(-4);
}
```

### Pattern 5: API Key Validation per Provider
**What:** Test each provider's API key with a lightweight API call before saving.
**When to use:** POST /api/keys (on save) and POST /api/keys/:id/validate.
**Example:**
```typescript
// backend/src/services/key-validator.ts
import { Provider } from '@repo/shared';

export async function validateApiKey(provider: Provider, key: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai': {
        // GET /v1/models is lightweight, confirms key works
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        return res.ok;
      }
      case 'anthropic': {
        // POST /v1/messages with minimal payload
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
        // 200 = valid, 401 = invalid key, other = might be rate limit (still valid key)
        return res.status !== 401;
      }
      case 'gemini': {
        // GET models list with API key
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${key}`
        );
        return res.ok;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}
```

### Anti-Patterns to Avoid
- **Storing encryption key in code:** The AES-256 encryption key MUST come from an environment variable, never hardcoded.
- **Returning decrypted keys in API responses:** Always return masked keys (e.g., `sk-...xxxx`). The decrypt function should only be called in processing pipelines, never in API handlers.
- **Using Passport.js for simple JWT:** Over-abstracted; jsonwebtoken + a 15-line middleware is simpler and more maintainable.
- **Putting business logic in route handlers:** Keep routes thin, delegate to service functions.
- **Using `any` for request types:** Extend Express Request interface properly for typed user payload.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | `bcryptjs` | Timing attacks, salt management, rounds configuration |
| JWT tokens | Custom token format | `jsonwebtoken` | Signature verification, expiry, standard claims |
| Input validation | Manual if/else checks | `zod` schemas | Type inference, nested validation, error formatting |
| UI components | Custom form inputs | `shadcn/ui` | Accessibility, keyboard navigation, consistent styling |
| Security headers | Manual header setting | `helmet` | CSP, HSTS, X-Frame-Options, all handled |
| CORS | Manual preflight handling | `cors` package | OPTIONS handling, credential support, origin matching |
| Database queries | Raw SQL | Prisma Client | Type safety, migrations, relation handling |

**Key insight:** Every "simple" auth implementation hides edge cases (timing-safe comparison, token rotation, header parsing). Use battle-tested libraries for all security-critical code.

## Common Pitfalls

### Pitfall 1: Prisma Client Not Regenerated
**What goes wrong:** Schema changes don't reflect in code; TypeScript types are stale.
**Why it happens:** Forgetting to run `npx prisma generate` after schema changes.
**How to avoid:** Add `prisma generate` to the `postinstall` script in backend/package.json. Also run it as part of the dev startup script.
**Warning signs:** TypeScript errors about missing fields, runtime query failures.

### Pitfall 2: JWT Secret Too Short or Predictable
**What goes wrong:** Tokens can be brute-forced or guessed.
**Why it happens:** Using simple strings like "secret" during development that leak to production.
**How to avoid:** Generate a 64+ character random string: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. Validate on startup that JWT_SECRET is set and >= 32 characters.
**Warning signs:** Short JWT_SECRET in .env, same secret across environments.

### Pitfall 3: AES-256-GCM IV Reuse
**What goes wrong:** Reusing the same IV with the same key completely breaks GCM security.
**Why it happens:** Using a static IV instead of generating random bytes per encryption.
**How to avoid:** Always use `crypto.randomBytes(12)` for each encryption call. Store IV alongside ciphertext.
**Warning signs:** All encrypted values start with the same prefix.

### Pitfall 4: API Keys Leaking in Error Logs
**What goes wrong:** Unhandled errors include the full request body (containing the API key) in logs.
**Why it happens:** Default error handlers log entire request objects.
**How to avoid:** Custom error handler middleware that strips sensitive fields. Never log `req.body` on key-related routes. Use a sanitize function.
**Warning signs:** API keys visible in server logs or error tracking services.

### Pitfall 5: npm Workspaces Hoisting Issues
**What goes wrong:** Packages can't find dependencies, or wrong versions are used.
**Why it happens:** npm hoists dependencies to root node_modules; sometimes version conflicts arise.
**How to avoid:** Be explicit about shared dependencies. Use `"dependencies": { "@repo/shared": "*" }` for workspace references. Run `npm install` from root.
**Warning signs:** "Module not found" errors, different behavior in CI vs local.

### Pitfall 6: Next.js App Router Auth State Hydration
**What goes wrong:** Protected pages flash unauthenticated content before redirecting.
**Why it happens:** Server-side rendering doesn't have access to client-side JWT stored in localStorage.
**How to avoid:** Use Next.js middleware for server-side auth checks, or store JWT in httpOnly cookies. For MVP, client-side redirect with loading state is acceptable.
**Warning signs:** Brief flash of login page or unprotected content on page load.

## Code Examples

### Prisma Schema for Phase 1
```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  apiKeys ApiKey[]

  @@map("users")
}

model ApiKey {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  provider     Provider
  encryptedKey String   @map("encrypted_key")
  isValid      Boolean  @default(true) @map("is_valid")
  label        String?  // User-friendly label like "My OpenAI Key"
  lastUsedAt   DateTime? @map("last_used_at")
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider]) // One key per provider per user
  @@map("api_keys")
}

enum Provider {
  openai
  anthropic
  gemini
}
```

### Shared Zod Schemas
```typescript
// shared/src/schemas/auth.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

```typescript
// shared/src/schemas/api-keys.ts
import { z } from 'zod';

export const providerEnum = z.enum(['openai', 'anthropic', 'gemini']);
export type Provider = z.infer<typeof providerEnum>;

export const addKeySchema = z.object({
  provider: providerEnum,
  key: z.string().min(10, 'API key is too short'),
  label: z.string().max(100).optional(),
});

export type AddKeyInput = z.infer<typeof addKeySchema>;

// Response type (never includes the actual key)
export interface ApiKeyResponse {
  id: string;
  provider: Provider;
  maskedKey: string;  // e.g., "sk-...abcd"
  isValid: boolean;
  label: string | null;
  createdAt: string;
}
```

### Express App Setup
```typescript
// backend/src/index.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './lib/config';
import { authRoutes } from './routes/auth';
import { keyRoutes } from './routes/keys';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/keys', keyRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
});
```

### Frontend API Client with JWT Interceptor
```typescript
// frontend/src/lib/api-client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (redirect to login)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Passport.js for auth | Direct jsonwebtoken + middleware | 2023+ | Less abstraction, simpler for JWT-only auth |
| Sequelize ORM | Prisma with type-safe client | 2022+ | Better TypeScript integration, auto-generated types |
| Material UI / Ant Design | shadcn/ui (copy-paste components) | 2023+ | Full control, no CSS-in-JS overhead, TailwindCSS native |
| Redux for all state | Zustand (client) + React Query (server) | 2023+ | Less boilerplate, proper separation of concerns |
| Custom validation | Zod schemas shared frontend/backend | 2023+ | Single source of truth for types and validation |
| Express 5 | Express 4.x (5 still experimental) | Current | Express 4 remains the stable production choice |

**Deprecated/outdated:**
- `bcrypt` (native bindings): Use `bcryptjs` (pure JS) for simpler deployment
- `body-parser`: Built into Express since 4.16 (`express.json()`)
- NextAuth.js for simple JWT: Over-engineered when backend handles auth; use direct JWT with localStorage for MVP

## Open Questions

1. **Cookie vs localStorage for JWT storage**
   - What we know: localStorage is simpler but vulnerable to XSS; httpOnly cookies are more secure but add CSRF complexity
   - What's unclear: Whether the project needs cookie-based auth for SSR pages
   - Recommendation: Use localStorage for MVP (simpler), all sensitive data comes from backend API not SSR. Document as a v2 security hardening item.

2. **One key per provider vs multiple keys per provider**
   - What we know: The Prisma schema has a unique constraint on (userId, provider), meaning one key per provider
   - What's unclear: Whether users might want multiple keys (e.g., different OpenAI orgs)
   - Recommendation: Keep one-per-provider for MVP. The schema constraint makes CRUD simpler. Easy to remove the constraint later.

3. **Encryption key rotation**
   - What we know: If the ENCRYPTION_KEY env var changes, all existing encrypted keys become unreadable
   - What's unclear: Whether key rotation is needed for MVP
   - Recommendation: Defer to post-MVP. Document that changing ENCRYPTION_KEY requires re-encrypting all stored keys.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (latest) |
| Config file | None -- Wave 0 will create `vitest.config.ts` in backend/ |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-1.1 | User registration creates hashed password | unit | `npx vitest run src/__tests__/auth.test.ts -t "register"` | No -- Wave 0 |
| FR-1.2 | Login returns valid JWT | unit | `npx vitest run src/__tests__/auth.test.ts -t "login"` | No -- Wave 0 |
| FR-1.3 | Protected routes reject missing/invalid JWT | unit | `npx vitest run src/__tests__/middleware/auth.test.ts` | No -- Wave 0 |
| FR-1.4 | Passwords hashed with bcrypt 10 rounds | unit | `npx vitest run src/__tests__/auth.test.ts -t "bcrypt"` | No -- Wave 0 |
| FR-1.5 | JWT expires after 7 days | unit | `npx vitest run src/__tests__/auth.test.ts -t "expiry"` | No -- Wave 0 |
| FR-2.1 | Add API key for each provider | unit | `npx vitest run src/__tests__/keys.test.ts -t "add"` | No -- Wave 0 |
| FR-2.2 | Key validation calls provider endpoint | unit | `npx vitest run src/__tests__/services/key-validator.test.ts` | No -- Wave 0 |
| FR-2.3 | AES-256-GCM encrypt/decrypt roundtrip | unit | `npx vitest run src/__tests__/services/key-manager.test.ts` | No -- Wave 0 |
| FR-2.4 | API responses return masked keys only | unit | `npx vitest run src/__tests__/keys.test.ts -t "masked"` | No -- Wave 0 |
| FR-2.6 | Delete API key removes from DB | unit | `npx vitest run src/__tests__/keys.test.ts -t "delete"` | No -- Wave 0 |
| NFR-2.4 | Invalid input returns 400 with zod errors | unit | `npx vitest run src/__tests__/middleware/validate.test.ts` | No -- Wave 0 |
| NFR-2.6 | CORS rejects non-whitelisted origins | unit | `npx vitest run src/__tests__/middleware/cors.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (in backend/)
- **Per wave merge:** `npx vitest run` (full backend suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/vitest.config.ts` -- vitest configuration
- [ ] `backend/src/__tests__/auth.test.ts` -- auth route tests
- [ ] `backend/src/__tests__/keys.test.ts` -- key management route tests
- [ ] `backend/src/__tests__/services/key-manager.test.ts` -- encryption unit tests
- [ ] `backend/src/__tests__/services/key-validator.test.ts` -- validation unit tests (mocked HTTP)
- [ ] `backend/src/__tests__/middleware/auth.test.ts` -- JWT middleware tests
- [ ] `backend/src/__tests__/middleware/validate.test.ts` -- zod middleware tests
- [ ] Framework install: `npm install -D vitest @vitest/coverage-v8`

## Sources

### Primary (HIGH confidence)
- Node.js crypto documentation (crypto.createCipheriv, GCM mode) -- verified AES-256-GCM pattern
- Prisma official documentation -- schema syntax, PostgreSQL setup, migrations
- Next.js official documentation -- App Router structure, project setup
- shadcn/ui installation docs -- component setup with Next.js

### Secondary (MEDIUM confidence)
- [Prisma + Express + TypeScript setup guides](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgresql) -- verified with official docs
- [AES-256-GCM GitHub gist patterns](https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81) -- cross-verified with Node.js crypto docs
- [JWT + Express + TypeScript patterns](https://dev.to/julienachmias/authentication-with-jwt-tokens-in-typescript-with-express-3gb1) -- common pattern, multiple sources agree
- [npm workspaces monorepo setup](https://medium.com/@serdar.ulutas/a-simple-monorepo-setup-with-next-js-and-express-js-4bbe0e99b259) -- verified with npm docs

### Tertiary (LOW confidence)
- API key validation endpoints for Anthropic and Gemini -- based on general API docs, specific "lightweight validation" endpoint behavior needs runtime verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries decided in project state, versions verified
- Architecture: HIGH -- monorepo pattern, Express middleware patterns are well-established
- Encryption: HIGH -- Node.js crypto AES-256-GCM is well-documented, pattern verified from multiple sources
- Auth flow: HIGH -- JWT + bcrypt is a well-trodden path
- API key validation: MEDIUM -- provider-specific endpoints verified for OpenAI, less certain for Anthropic/Gemini lightweight calls
- Pitfalls: HIGH -- common issues with Prisma, JWT, GCM are well-documented

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable technologies, 30-day validity)
