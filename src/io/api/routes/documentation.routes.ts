import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { Container } from '../../../composition/container';
import { registerRouteModule } from '../registry';

export function setupDocumentationRoutes(app: OpenAPIHono, container: Container) {
  const services = container.getServiceContainer();
  const isDevelopment = services.environment === 'development';

  // OpenAPI specification
  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Serverless CMS API',
      description: 'A modular headless CMS built with Cloudflare Workers',
    },
    servers: [
      {
        url: isDevelopment ? 'http://127.0.0.1:8787' : 'https://your-api-domain.com',
        description: isDevelopment ? 'Development server' : 'Production server',
      },
    ],
  });

  // API documentation UI (only in development)
  if (isDevelopment) {
    app.get('/docs', Scalar({
      theme: 'elysiajs',
      layout: 'modern',
      url: '/openapi.json',
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
    }));
  }
}

// Register the documentation routes
registerRouteModule('documentation', {
  setup: setupDocumentationRoutes,
  priority: 0, // Highest priority - setup first
});
