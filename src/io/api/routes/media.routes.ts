import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { Container } from '../../../composition/container';
import { registerRouteModule } from '../registry';

export function setupMediaRoutes(app: OpenAPIHono, container: Container) {
  // TODO: Implement media routes
  app.openapi(
    {
      method: 'get',
      path: '/api/media',
      tags: ['Media'],
      summary: 'Get media (placeholder)',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: 'Media feature placeholder',
        },
      },
    },
    (c) => c.json({ message: 'Media feature not implemented yet' })
  );
}

// Register the media routes
registerRouteModule('media', {
  setup: setupMediaRoutes,
  feature: 'media', // Only load if media feature is enabled
  priority: 30,
});
