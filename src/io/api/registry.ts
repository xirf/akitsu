import { OpenAPIHono } from '@hono/zod-openapi';
import { Container } from '../../composition/container';
import { getEnabledFeatures } from '../../composition/features';

// Route registration types
interface RouteModule {
  setup: (app: OpenAPIHono, container: Container) => void;
  feature?: string; // Optional feature dependency
  priority?: number; // Route setup priority (lower = earlier)
}

// Route registry
class RouteRegistry {
  private routes: Map<string, RouteModule> = new Map();

  register(name: string, module: RouteModule) {
    this.routes.set(name, module);
  }

  getRoutes(): Map<string, RouteModule> {
    return this.routes;
  }

  getEnabledRoutes(): RouteModule[] {
    const enabledFeatures = getEnabledFeatures();
    
    return Array.from(this.routes.values())
      .filter(route => !route.feature || enabledFeatures.includes(route.feature))
      .sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }
}

// Global route registry instance
export const routeRegistry = new RouteRegistry();

// Auto-setup all registered routes
export function setupRegisteredRoutes(app: OpenAPIHono, container: Container) {
  const enabledRoutes = routeRegistry.getEnabledRoutes();
  
  for (const route of enabledRoutes) {
    try {
      route.setup(app, container);
    } catch (error) {
      console.error('Failed to setup route:', error);
    }
  }
}

// Helper function to register a route module
export function registerRouteModule(name: string, module: RouteModule) {
  routeRegistry.register(name, module);
}
