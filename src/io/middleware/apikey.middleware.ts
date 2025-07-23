import { Context, Next } from 'hono';
import { ApiKeyUnit } from '../../features/apikey/apikey.unit';
import { D1ApiKeyAdapter } from '../../infra/apikey/d1-apikey';

export interface ApiKeyMiddlewareOptions {
    requiredPermission?: 'read' | 'write' | 'admin';
    checkDomain?: boolean;
}

export function createApiKeyMiddleware(
    database: D1Database,
    options: ApiKeyMiddlewareOptions = {}
) {
    const { requiredPermission = 'read', checkDomain = true } = options;
    
    return async (c: Context, next: Next) => {
        try {
            // Check for API key in headers
            const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
            
            if (!apiKey) {
                return c.json({
                    success: false,
                    error: 'API key required',
                    message: 'API key is required for this endpoint'
                }, 401);
            }

            // Skip if it's a JWT token (starts with 'eyJ')
            if (apiKey.startsWith('eyJ')) {
                return await next();
            }

            const apiKeyAdapter = new D1ApiKeyAdapter(database);
            const apiKeyUnit = new ApiKeyUnit(apiKeyAdapter);

            // Verify API key
            const keyData = await apiKeyUnit.verifyApiKey(apiKey);

            // Check permissions
            const hasPermission = await apiKeyUnit.checkPermission(keyData, requiredPermission);
            if (!hasPermission) {
                return c.json({
                    success: false,
                    error: 'Insufficient permissions',
                    message: `This endpoint requires '${requiredPermission}' permission`
                }, 403);
            }

            // Check domain restrictions
            if (checkDomain) {
                const origin = c.req.header('Origin') || c.req.header('Referer');
                if (origin) {
                    const domain = new URL(origin).hostname;
                    const isDomainAllowed = await apiKeyUnit.checkDomain(keyData, domain);
                    
                    if (!isDomainAllowed) {
                        return c.json({
                            success: false,
                            error: 'Domain not allowed',
                            message: `Access from domain '${domain}' is not permitted`
                        }, 403);
                    }
                }
            }

            // Store API key data in context for use in handlers
            c.set('apiKey', keyData);
            c.set('userId', keyData.userId);

            return await next();
        } catch (error: any) {
            return c.json({
                success: false,
                error: 'Invalid API key',
                message: error.message
            }, 401);
        }
    };
}

// Convenience middlewares for different permission levels
export function requireReadApiKey(database: D1Database) {
    return createApiKeyMiddleware(database, { requiredPermission: 'read' });
}

export function requireWriteApiKey(database: D1Database) {
    return createApiKeyMiddleware(database, { requiredPermission: 'write' });
}

export function requireAdminApiKey(database: D1Database) {
    return createApiKeyMiddleware(database, { requiredPermission: 'admin' });
}
