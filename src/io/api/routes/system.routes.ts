import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { Container } from '../../../composition/container';
import { getEnabledFeatures } from '../../../composition/features';
import { registerRouteModule } from '../registry';

export function setupSystemRoutes(app: OpenAPIHono, container: Container) {
  const enabledFeatures = getEnabledFeatures();
  
  // Health check
  app.openapi(
    {
      method: 'get',
      path: '/health',
      tags: ['System'],
      summary: 'Health check',
      description: 'Check API health and enabled features',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
                features: z.array(z.string()),
                timestamp: z.string(),
              }),
            },
          },
          description: 'API is healthy',
        },
      },
    },
    (c) => {
      return c.json({
        success: true,
        message: 'CMS API is running',
        features: enabledFeatures,
        timestamp: new Date().toISOString()
      });
    }
  );
}

// Register the system routes
registerRouteModule('system', {
  setup: setupSystemRoutes,
  priority: 1, // High priority - setup first
});
