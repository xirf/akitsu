import { OpenAPIHono } from '@hono/zod-openapi';
import { Container } from '../../../composition/container';
import { AuthUnit } from '../../../features/auth/auth.unit';
import { D1AuthAdapter } from '../../../infra/auth/d1-auth';
import {
    registerRoute,
    loginRoute,
    refreshRoute,
    meRoute
} from '../../../features/auth/auth.io';
import { registerRouteModule } from '../registry';

export function setupAuthRoutes(app: OpenAPIHono, container: Container) {
    const services = container.getServiceContainer();
    const authAdapter = new D1AuthAdapter(services.database, services.jwtSecret);
    const authUnit = new AuthUnit(authAdapter);

    // Register route
    app.openapi(registerRoute, async (c) => {
        try {
            const body = c.req.valid('json');
            const result = await authUnit.register(body);

            return c.json({
                success: true,
                data: result,
                message: 'User registered successfully'
            }, 201);
        } catch (error: any) {
            return c.json({
                success: false as const,
                error: error.message,
                message: error.message
            }, error.statusCode || 400);
        }
    });

    // Login route
    app.openapi(loginRoute, async (c) => {
        try {
            const body = c.req.valid('json');
            const result = await authUnit.login(body);

            return c.json({
                success: true,
                data: result,
                message: 'Login successful'
            }, 200);
        } catch (error: any) {
            return c.json({
                success: false as const,
                error: error.message,
                message: error.message
            }, error.statusCode || 401);
        }
    });

    // Refresh route
    app.openapi(refreshRoute, async (c) => {
        try {
            const body = c.req.valid('json');
            const result = await authUnit.refreshToken(body.refreshToken);

            return c.json({
                success: true,
                data: result,
                message: 'Token refreshed successfully'
            }, 200);
        } catch (error: any) {
            return c.json({
                success: false as const,
                error: error.message,
                message: error.message
            }, error.statusCode || 401);
        }
    });

    // Me route
    app.openapi(meRoute, async (c) => {
        try {
            const authHeader = c.req.header('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return c.json({
                    success: false as const,
                    error: 'Authorization header missing',
                    message: 'Authorization header missing'
                }, 401);
            }

            const token = authHeader.substring(7);
            const user = await authUnit.verifyToken(token);

            return c.json({
                success: true,
                data: { user },
                message: 'User retrieved successfully'
            }, 200);
        } catch (error: any) {
            return c.json({
                success: false as const,
                error: error.message,
                message: error.message
            }, error.statusCode || 401);
        }
    });
}

// Register the auth routes
registerRouteModule('auth', {
    setup: setupAuthRoutes,
    feature: 'auth', // Only load if auth feature is enabled
    priority: 10,
});
