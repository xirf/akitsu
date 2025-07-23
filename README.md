# Serverless Headless CMS

A modular, serverless headless CMS built with TypeScript, Hono, and Cloudflare Workers.

## Architecture

This CMS follows a modular architecture that allows you to easily enable/disable features:

```
src/
├── features/           # Self-contained feature modules
│   ├── auth/          # Authentication & authorization
│   ├── content/       # Content management (TODO)
│   └── media/         # Media management (TODO)
├── io/                # Input/Output adapters
│   ├── api/           # HTTP API routes
│   │   ├── routes/    # Modular route definitions
│   │   ├── base/      # Base route classes
│   │   ├── registry.ts # Route registration system
│   │   └── routeMap.ts # Main route setup
│   └── cli/           # CLI commands (TODO)
├── infra/             # Infrastructure adapters
│   ├── auth/          # Auth providers (D1, JWT)
│   └── database/      # Database adapters
├── shared/            # Shared utilities & types
├── composition/       # Feature composition & DI
└── runtime/           # Application bootstrap
```

## Features

- ✅ **Authentication**: JWT-based auth with bcrypt password hashing
- ⏳ **Content Management**: CRUD operations for content (planned)
- ⏳ **Media Management**: File upload and management (planned)
- ⏳ **Analytics**: Usage analytics (planned)

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript
- **Authentication**: JWT + bcrypt

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example wrangler.toml and update with your values:

```toml
name = "cms-serverless"
main = "src/runtime/api.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "cms-db"
database_id = "your-database-id-here"

[vars]
JWT_SECRET = "your-jwt-secret-here"
ENVIRONMENT = "development"
```

### 3. Create D1 Database

```bash
# Create database
npx wrangler d1 create cms-db

# Copy the database_id to wrangler.toml

# Run migrations
npx wrangler d1 migrations apply cms-db --local
```

### 4. Development

```bash
# Start development server
npm run dev
```

The API will be available at `http://localhost:8787`

### 5. Deploy

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## API Endpoints

### Health Check
- `GET /health` - API health status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Example Usage

#### Register a new user:
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123",
    "role": "admin"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123"
  }'
```

#### Get user info:
```bash
curl -X GET http://localhost:8787/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Feature Configuration

Features can be enabled/disabled in `src/composition/features.ts`:

```typescript
export const FEATURES: Record<string, FeatureConfig> = {
  auth: { enabled: true },
  content: { enabled: true, dependencies: ['auth'] },
  media: { enabled: false }, // Disabled
  analytics: { enabled: false } // Disabled
};
```

## Project Structure Benefits

1. **Modular**: Each feature is self-contained and can be easily removed
2. **Scalable**: Features can be deployed as separate services later
3. **Testable**: Each layer can be tested independently
4. **Runtime Agnostic**: Same code works in API, CLI, workers
5. **Infrastructure Swappable**: Easy to change database/storage providers

## Development

### Adding a New Feature

1. Create folder in `src/features/your-feature/`
2. Implement the 5 files: `.io.ts`, `.unit.ts`, `.fx.ts`, `.runner.ts`, `index.ts`
3. Create infrastructure adapter in `src/infra/`
4. Create route file in `src/io/api/routes/your-feature.routes.ts`
5. Enable in `src/composition/features.ts`

### Adding New Routes

Create a new route file in `src/io/api/routes/`:

```typescript
import { OpenAPIHono } from '@hono/zod-openapi';
import { Container } from '../../../composition/container';
import { registerRouteModule } from '../registry';

export function setupYourFeatureRoutes(app: OpenAPIHono, container: Container) {
  // Your route definitions here
  app.get('/api/your-feature', (c) => {
    return c.json({ message: 'Your feature endpoint' });
  });
}

// Register the routes
registerRouteModule('your-feature', {
  setup: setupYourFeatureRoutes,
  feature: 'your-feature', // Optional: only load if feature is enabled
  priority: 40, // Optional: setup priority (lower = earlier)
});
```

Then import the file in `src/io/api/routeMap.ts` to register it.

### Running Tests

```bash
npm test
```

### Database Migrations

```bash
# Create new migration
npx wrangler d1 migrations create cms-db "migration_name"

# Apply migrations locally
npx wrangler d1 migrations apply cms-db --local

# Apply migrations to production
npx wrangler d1 migrations apply cms-db
```

## License

MIT
