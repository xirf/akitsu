import { OpenAPIHono } from '@hono/zod-openapi';
import { Container } from '../../composition/container';
import { setupRegisteredRoutes } from './registry';
import './routes/documentation.routes';
import './routes/system.routes'; 
import './routes/auth.routes';
import './routes/content.routes';
import './routes/media.routes';
import './routes/apikey.routes';

// Import route modules to trigger their registration

export function setupRoutes(app: OpenAPIHono, container: Container) {
  // Setup all registered routes automatically based on enabled features
  setupRegisteredRoutes(app, container);
}
