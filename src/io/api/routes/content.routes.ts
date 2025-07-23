import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { Container } from '../../../composition/container';
import { registerRouteModule } from '../registry';

export function setupContentRoutes(app: OpenAPIHono, container: Container) {
  // TODO: Implement content routes
  app.openapi(
    {
      method: 'get',
      path: '/api/content',
      tags: ['Content'],
      summary: 'Get content (placeholder)',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: 'Content feature placeholder',
        },
      },
    },
    (c) => c.json({ message: 'Content feature not implemented yet' })
  );
}

// Register the content routes
registerRouteModule('content', {
  setup: setupContentRoutes,
  feature: 'content', // Only load if content feature is enabled
  priority: 20,
});
