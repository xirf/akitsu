import { OpenAPIHono } from '@hono/zod-openapi';
import { Container } from '../../../composition/container';
import { ApiKeyUnit } from '../../../features/apikey/apikey.unit';
import { D1ApiKeyAdapter } from '../../../infra/apikey/d1-apikey';
import {
    createApiKeyRoute,
    listApiKeysRoute,
    getApiKeyRoute,
    updateApiKeyRoute,
    deleteApiKeyRoute
} from '../../../features/apikey/apikey.io';
import { registerRouteModule } from '../registry';

export function setupApiKeyRoutes(app: OpenAPIHono, container: Container) {
    const services = container.getServiceContainer();
    const apiKeyAdapter = new D1ApiKeyAdapter(services.database);
    const apiKeyUnit = new ApiKeyUnit(apiKeyAdapter);

    // Helper function to extract user from JWT token
    async function getUserFromToken(c: any): Promise<{ id: string, role: string }> {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Authorization header missing');
        }

        const token = authHeader.substring(7);
        try {
            const jwt = await import('jsonwebtoken');
            const decoded = jwt.verify(token, services.jwtSecret) as any;
            
            return { id: decoded.userId, role: decoded.role };
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Create API key
    app.openapi(createApiKeyRoute, async (c) => {
        try {
            const user = await getUserFromToken(c);
            
            // Only admins can create API keys for now
            if (user.role !== 'admin') {
                return c.json({
                    success: false as const,
                    error: 'Admin access required',
                    message: 'Admin access required'
                }, 403);
            }

            const body = c.req.valid('json');
            const result = await apiKeyUnit.createApiKey(body, user.id);

            return c.json({
                success: true,
                data: result,
                message: 'API key created successfully'
            }, 201);
        } catch (error: any) {
            return c.json({
                success: false as const,
                error: error.message,
                message: error.message
            }, error.statusCode || 400);
        }
    });

    // List API keys
    app.openapi(listApiKeysRoute, async (c) => {
        try {
            const user = await getUserFromToken(c);
            const result = await apiKeyUnit.listApiKeys(user.id);

            return c.json({
                success: true,
                data: result,
                message: 'API keys retrieved successfully'
            }, 200);
        } catch (error: any) {
            return c.json({
                success: false as const,
                error: error.message,
                message: error.message
            }, error.statusCode || 401);
        }
    });

    // Get specific API key
    app.openapi(getApiKeyRoute, async (c) => {
        try {
            const user = await getUserFromToken(c);
            const { id } = c.req.valid('param');
            const result = await apiKeyUnit.getApiKey(id, user.id);

            return c.json({
                success: true,
                data: result,
                message: 'API key retrieved successfully'
            }, 200);
        } catch (error: any) {
            return c.json({
                success: false as const,
                error: error.message,
                message: error.message
            }, error.statusCode || 404);
        }
    });

    // Update API key
    app.openapi(updateApiKeyRoute, async (c) => {
        try {
            const user = await getUserFromToken(c);
            const { id } = c.req.valid('param');
            const body = c.req.valid('json');
            const result = await apiKeyUnit.updateApiKey(id, body, user.id);

            return c.json({
                success: true,
                data: result,
                message: 'API key updated successfully'
            }, 200);
        } catch (error: any) {
            return c.json({
                success: false as const,
                error: error.message,
                message: error.message
            }, error.statusCode || 404);
        }
    });

    // Delete API key
    app.openapi(deleteApiKeyRoute, async (c) => {
        try {
            const user = await getUserFromToken(c);
            const { id } = c.req.valid('param');
            await apiKeyUnit.deleteApiKey(id, user.id);

            return c.json({
                success: true,
                message: 'API key deleted successfully'
            }, 200);
        } catch (error: any) {
            return c.json({
                success: false as const,
                error: error.message,
                message: error.message
            }, error.statusCode || 404);
        }
    });
}

// Register the API key routes
registerRouteModule('apikey', {
    setup: setupApiKeyRoutes,
    feature: 'apikey',
    priority: 20,
});
