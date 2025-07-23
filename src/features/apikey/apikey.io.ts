import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';

// Input schemas
export const CreateApiKeySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    permissions: z.array(z.enum(['read', 'write', 'admin'])).min(1, 'At least one permission required'),
    rateLimit: z.number().min(1).max(10000).default(1000),
    domains: z.array(z.string().url()).optional(),
    expiresAt: z.string().optional()
});

export const UpdateApiKeySchema = z.object({
    name: z.string().min(1).optional(),
    permissions: z.array(z.enum(['read', 'write', 'admin'])).min(1).optional(),
    rateLimit: z.number().min(1).max(10000).optional(),
    domains: z.array(z.string().url()).optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean().optional()
});

// Output schemas
export const ApiKeyResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    key: z.string().optional(), // Only shown on creation
    permissions: z.array(z.enum(['read', 'write', 'admin'])),
    rateLimit: z.number(),
    domains: z.array(z.string()),
    expiresAt: z.string().nullable(),
    isActive: z.boolean(),
    userId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastUsedAt: z.string().nullable()
});

export const ApiKeyListResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    permissions: z.array(z.enum(['read', 'write', 'admin'])),
    rateLimit: z.number(),
    domains: z.array(z.string()),
    expiresAt: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string(),
    lastUsedAt: z.string().nullable()
});

export const ApiResponseSchema = z.object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: z.string().optional(),
    message: z.string()
});

export const ApiErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.string(),
    message: z.string()
});

// OpenAPI Route Definitions
export const createApiKeyRoute = createRoute({
    method: 'post',
    path: '/api/admin/apikeys',
    tags: ['Admin - API Keys'],
    summary: 'Create new API key',
    description: 'Create a new API key for accessing the CMS',
    security: [{ Bearer: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateApiKeySchema,
                },
            },
        },
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: ApiResponseSchema.extend({
                        data: ApiKeyResponseSchema
                    }),
                },
            },
            description: 'API key created successfully',
        },
        400: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Validation error',
        },
        401: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Authentication required',
        },
        403: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Admin access required',
        },
    },
});

export const listApiKeysRoute = createRoute({
    method: 'get',
    path: '/api/admin/apikeys',
    tags: ['Admin - API Keys'],
    summary: 'List API keys',
    description: 'Get all API keys for the current user',
    security: [{ Bearer: [] }],
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ApiResponseSchema.extend({
                        data: z.array(ApiKeyListResponseSchema)
                    }),
                },
            },
            description: 'API keys retrieved successfully',
        },
        401: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Authentication required',
        },
    },
});

export const getApiKeyRoute = createRoute({
    method: 'get',
    path: '/api/admin/apikeys/{id}',
    tags: ['Admin - API Keys'],
    summary: 'Get API key details',
    description: 'Get details of a specific API key',
    security: [{ Bearer: [] }],
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ApiResponseSchema.extend({
                        data: ApiKeyListResponseSchema
                    }),
                },
            },
            description: 'API key retrieved successfully',
        },
        404: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'API key not found',
        },
        401: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Authentication required',
        },
    },
});

export const updateApiKeyRoute = createRoute({
    method: 'put',
    path: '/api/admin/apikeys/{id}',
    tags: ['Admin - API Keys'],
    summary: 'Update API key',
    description: 'Update an existing API key',
    security: [{ Bearer: [] }],
    request: {
        params: z.object({
            id: z.string(),
        }),
        body: {
            content: {
                'application/json': {
                    schema: UpdateApiKeySchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ApiResponseSchema.extend({
                        data: ApiKeyListResponseSchema
                    }),
                },
            },
            description: 'API key updated successfully',
        },
        404: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'API key not found',
        },
        401: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Authentication required',
        },
    },
});

export const deleteApiKeyRoute = createRoute({
    method: 'delete',
    path: '/api/admin/apikeys/{id}',
    tags: ['Admin - API Keys'],
    summary: 'Delete API key',
    description: 'Delete an existing API key',
    security: [{ Bearer: [] }],
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ApiResponseSchema.extend({
                        data: z.optional(z.null())
                    }),
                },
            },
            description: 'API key deleted successfully',
        },
        404: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'API key not found',
        },
        401: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Authentication required',
        },
    },
});

// Type exports
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof UpdateApiKeySchema>;
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;
export type ApiKeyListResponse = z.infer<typeof ApiKeyListResponseSchema>;

// Validation helpers
export function validateCreateApiKeyInput(data: unknown): CreateApiKeyInput {
    return CreateApiKeySchema.parse(data);
}

export function validateUpdateApiKeyInput(data: unknown): UpdateApiKeyInput {
    return UpdateApiKeySchema.parse(data);
}
