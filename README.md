# Akitsu Serverless CMS

The serverless CMS built for Cloudflare's edge network.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)](https://hono.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔐 **Authentication & Authorization**: JWT-based auth with bcrypt password hashing
- 🔑 **API Key Management**: Create and manage API keys with fine-grained permissions
- 📄 **Content Management**: Flexible content models with dynamic field types
- 🎯 **Type-Safe**: Full TypeScript support with Zod validation
- 🏗️ **Modular Architecture**: Enable/disable features as needed
- 📖 **OpenAPI Documentation**: Auto-generated API documentation
- ⚡ **Serverless**: Built for Cloudflare Workers
- 🗄️ **SQLite Database**: Cloudflare D1 for data persistence

## Features

- ✅ **Authentication**: JWT-based auth with bcrypt password hashing
- ⏳ **Content Management**: CRUD operations for content (in progress)
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

## 📋 API Endpoints

### Health Check
- `GET /health` - API health status
- `GET /api/docs` - OpenAPI documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### API Keys (Admin)
- `POST /api/admin/apikeys` - Create API key
- `GET /api/admin/apikeys` - List API keys
- `GET /api/admin/apikeys/{id}` - Get API key details
- `PUT /api/admin/apikeys/{id}` - Update API key
- `DELETE /api/admin/apikeys/{id}` - Delete API key

### Content Management
- `POST /api/content/models` - Create content model
- `GET /api/content/models` - List content models
- `GET /api/content/models/{slug}` - Get content model
- `PUT /api/content/models/{slug}` - Update content model
- `DELETE /api/content/models/{slug}` - Delete content model
- `POST /api/content/{model}` - Create content item
- `GET /api/content/{model}` - List content items
- `GET /api/content/{model}/{slug}` - Get content item
- `PUT /api/content/{model}/{slug}` - Update content item
- `DELETE /api/content/{model}/{slug}` - Delete content item

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
  apikey: { enabled: true, dependencies: ['auth'] },
  media: { enabled: false }, // Disabled
  analytics: { enabled: false } // Disabled
};
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏗️ Project Status

- ✅ Authentication & JWT
- ✅ API Key Management  
- ✅ Content Models
- ✅ Content Items CRUD
- ✅ OpenAPI Documentation
- ⏳ Media Management
- ⏳ File Upload
- ⏳ Analytics
- ⏳ Webhooks
- ⏳ Multi-tenancy

## 🙏 Acknowledgments

- [Hono](https://hono.dev/) - Fast, lightweight web framework
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform
- [Zod](https://zod.dev/) - TypeScript-first schema validation

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
