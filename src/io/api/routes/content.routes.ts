import { OpenAPIHono } from '@hono/zod-openapi';
import { Container } from '../../../composition/container';
import { registerRouteModule } from '../registry';
import { ContentUnit } from '../../../features/content/content.unit';
import { D1ContentRunner } from '../../../features/content/content.runner';
import {
  createContentModelRoute,
  listContentModelsRoute,
  getContentModelRoute,
  updateContentModelRoute,
  deleteContentModelRoute,
  createContentItemRoute,
  listContentItemsRoute,
  getContentItemRoute,
  updateContentItemRoute,
  deleteContentItemRoute,
} from '../../../features/content/content.io';

export function setupContentRoutes(app: OpenAPIHono, container: Container) {
  const services = container.getServiceContainer();
  const contentRunner = new D1ContentRunner(services.database);
  const contentUnit = new ContentUnit(contentRunner);

  // Helper function to validate API key
  async function validateApiKey(c: any): Promise<void> {
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      throw new Error('API key required');
    }

    // Basic validation - should integrate with proper API key validation
    // For now, we'll accept any non-empty key
    if (!apiKey.trim()) {
      throw new Error('Invalid API key');
    }
  }

  // =============== CONTENT MODELS API ===============

  // Create content model
  app.openapi(createContentModelRoute, async (c) => {
    try {
      await validateApiKey(c);
      const body = c.req.valid('json');
      // TODO: Get from auth context
      const result = await contentUnit.createContentModel(body, 'user-id');

      return c.json({
        success: true as const,
        data: result,
        message: 'Content model created successfully'
      }, 201);
    } catch (error: any) {
      if (error.message.includes('API key')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: error.message
        }, 401);
      }
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to create content model'
      }, 400);
    }
  });

  // List all content models
  app.openapi(listContentModelsRoute, async (c) => {
    try {
      const result = await contentUnit.listContentModels();

      return c.json({
        success: true as const,
        message: 'Content models listed successfully',
        data: result
      }, 200);
    } catch (error: any) {
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to list content models'
      }, 500);
    }
  });

  // Get specific content model
  app.openapi(getContentModelRoute, async (c) => {
    try {
      const { slug } = c.req.valid('param');
      const result = await contentUnit.getContentModel(slug);

      return c.json({
        success: true as const,
        message: 'Content model retrieved successfully',
        data: result
      }, 200);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: 'Content model not found'
        }, 404);
      }
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to get content model'
      }, 500);
    }
  });

  // Update content model
  app.openapi(updateContentModelRoute, async (c) => {
    try {
      await validateApiKey(c);
      const { slug } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await contentUnit.updateContentModel(slug, body);

      return c.json({
        success: true as const,
        data: result,
        message: 'Content model updated successfully'
      }, 200);
    } catch (error: any) {
      if (error.message.includes('API key')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: error.message
        }, 401);
      }
      if (error.message.includes('not found')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: 'Content model not found'
        }, 404);
      }
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to update content model'
      }, 400);
    }
  });

  // Delete content model
  app.openapi(deleteContentModelRoute, async (c) => {
    try {
      await validateApiKey(c);
      const { slug } = c.req.valid('param');
      await contentUnit.deleteContentModel(slug);

      return c.body(null, 204);
    } catch (error: any) {
      if (error.message.includes('API key')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: error.message
        }, 401);
      }
      if (error.message.includes('not found')) {
        return c.json({
          success: false as const,
          error: error.message
        }, 404);
      }
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to delete content model'
      }, 400);
    }
  });

  // =============== CONTENT ITEMS API ===============

  // Create content item
  app.openapi(createContentItemRoute, async (c) => {
    try {
      await validateApiKey(c);
      const { model } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await contentUnit.createContentItem(model, body, 'user-id'); // TODO: Get from auth context

      return c.json({
        success: true as const,
        data: result,
        message: 'Content item created successfully'
      }, 201);
    } catch (error: any) {
      if (error.message.includes('API key')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: error.message
        }, 401);
      }
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to create content item'
      }, 400);
    }
  });

  // List content items
  app.openapi(listContentItemsRoute, async (c) => {
    try {
      const { model } = c.req.valid('param');
      const query = c.req.valid('query');

      const result = await contentUnit.listContentItems(model, {
        status: query.status,
        limit: query.limit ? query.limit : undefined,
        offset: query.offset ? query.offset : undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        search: query.populate, // Reusing populate field for search for now
      });

      return c.json({
        success: true as const,
        message: 'Content items listed successfully',
        data: {
          items: result.items,
          total: result.total,
          limit: query.limit ? query.limit : undefined,
          offset: query.offset ? query.offset : undefined,
        }
      }, 200);
    } catch (error: any) {
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to list content items'
      }, 500);
    }
  });

  // Get specific content item
  app.openapi(getContentItemRoute, async (c) => {
    try {
      const { model, slug } = c.req.valid('param');
      const result = await contentUnit.getContentItem(model, slug);

      return c.json({
        success: true as const,
        message: 'Content item retrieved successfully',
        data: result
      }, 200);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: 'Content item not found'
        }, 404);
      }
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to get content item'
      }, 500);
    }
  });

  // Update content item
  app.openapi(updateContentItemRoute, async (c) => {
    try {
      await validateApiKey(c);
      const { model, slug } = c.req.valid('param');
      const body = c.req.valid('json');
      const result = await contentUnit.updateContentItem(model, slug, body);

      return c.json({
        success: true as const,
        data: result,
        message: 'Content item updated successfully'
      }, 200);
    } catch (error: any) {
      if (error.message.includes('API key')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: error.message
        }, 401);
      }
      if (error.message.includes('not found')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: 'Content item not found'
        }, 404);
      }
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to update content item'
      }, 400);
    }
  });

  // Delete content item
  app.openapi(deleteContentItemRoute, async (c) => {
    try {
      await validateApiKey(c);
      const { model, slug } = c.req.valid('param');
      await contentUnit.deleteContentItem(model, slug);

      return c.body(null, 204);
    } catch (error: any) {
      if (error.message.includes('API key')) {
        return c.json({
          success: false as const,
          error: error.message,
          message: error.message
        }, 401);
      }
      if (error.message.includes('not found')) {
        return c.json({
          success: false as const,
          error: error.message
        }, 404);
      }
      return c.json({
        success: false as const,
        error: error.message,
        message: 'Failed to delete content item'
      }, 400);
    }
  });
}

// Register content routes in the routing system
registerRouteModule('content', {
  setup: setupContentRoutes,
  feature: 'content',
  priority: 20,
});
