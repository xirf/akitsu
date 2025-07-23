import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Container, AppEnv } from '../composition/container';
import { validateFeatureDependencies } from '../composition/features';
import { setupRoutes } from '../io/api/routeMap';

// Validate feature dependencies at module level
validateFeatureDependencies();

export default {
  async fetch(request: Request, env: AppEnv, ctx: ExecutionContext): Promise<Response> {
    try {
      // Create app instance for this worker
      const app = new OpenAPIHono();
      
      // Initialize container with environment
      const container = new Container(env);
      
      // Global middleware
      app.use('*', cors({
        origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  
        credentials: true,
      }));

      app.use('*', logger());

      // Error handling middleware
      app.onError((err, c) => {
        console.error('Global error:', err);
        return c.json({
          success: false,
          error: 'Internal server error',
          message: 'An unexpected error occurred'
        }, 500);
      });

      // Not found handler
      app.notFound((c) => {
        return c.json({
          success: false,
          error: 'Not found', 
          message: 'The requested resource was not found'
        }, 404);
      });
      
      // Setup routes
      setupRoutes(app, container);
      
      // Handle the request
      return await app.fetch(request, env, ctx);
    } catch (error) {
      console.error('Startup error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Startup error',
        message: 'Failed to initialize application'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
