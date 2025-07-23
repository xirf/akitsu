import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import {
    IdParamSchema,
    SlugParamSchema,
    BearerAuthSecurity,
    BearerAuthSecurityAlt,
    CommonErrorResponses,
    createSuccessResponse,
    createPaginatedResponse
} from './common';

// Common route configuration builders
export interface RouteConfig {
    method: 'get' | 'post' | 'put' | 'delete';
    path: string;
    tags: string[];
    summary: string;
    description?: string;
    requiresAuth?: boolean;
    authType?: 'Bearer' | 'bearerAuth';
}

export interface CreateRouteConfig extends RouteConfig {
    method: 'post';
    inputSchema: z.ZodType;
    outputSchema: z.ZodType;
}

export interface ListRouteConfig extends RouteConfig {
    method: 'get';
    querySchema?: z.ZodType;
    outputSchema: z.ZodType;
    paginated?: boolean;
}

export interface GetByIdRouteConfig extends RouteConfig {
    method: 'get';
    paramType: 'id' | 'slug';
    outputSchema: z.ZodType;
}

export interface UpdateRouteConfig extends RouteConfig {
    method: 'put';
    paramType: 'id' | 'slug';
    inputSchema: z.ZodType;
    outputSchema: z.ZodType;
}

export interface DeleteRouteConfig extends RouteConfig {
    method: 'delete';
    paramType: 'id' | 'slug';
}

// Route builders
export function createCreateRoute(config: CreateRouteConfig) {
    const security = config.requiresAuth 
        ? (config.authType === 'bearerAuth' ? BearerAuthSecurityAlt : BearerAuthSecurity)
        : undefined;

    return createRoute({
        method: config.method,
        path: config.path,
        tags: config.tags,
        summary: config.summary,
        description: config.description,
        security,
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: config.inputSchema,
                    },
                },
            },
        },
        responses: {
            201: {
                content: {
                    'application/json': {
                        schema: createSuccessResponse(config.outputSchema),
                    },
                },
                description: `${config.summary} successful`,
            },
            ...CommonErrorResponses,
        },
    });
}

export function createListRoute(config: ListRouteConfig) {
    const security = config.requiresAuth 
        ? (config.authType === 'bearerAuth' ? BearerAuthSecurityAlt : BearerAuthSecurity)
        : undefined;

    const responseSchema = config.paginated 
        ? createPaginatedResponse(config.outputSchema)
        : createSuccessResponse(z.array(config.outputSchema));

    const request = config.querySchema ? {
        query: config.querySchema as any,
    } : undefined;

    return createRoute({
        method: config.method,
        path: config.path,
        tags: config.tags,
        summary: config.summary,
        description: config.description,
        security,
        request,
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: responseSchema,
                    },
                },
                description: `${config.summary} successful`,
            },
            ...CommonErrorResponses,
        },
    });
}

export function createGetByIdRoute(config: GetByIdRouteConfig) {
    const security = config.requiresAuth 
        ? (config.authType === 'bearerAuth' ? BearerAuthSecurityAlt : BearerAuthSecurity)
        : undefined;

    const paramSchema = config.paramType === 'id' ? IdParamSchema : SlugParamSchema;

    return createRoute({
        method: config.method,
        path: config.path,
        tags: config.tags,
        summary: config.summary,
        description: config.description,
        security,
        request: {
            params: paramSchema,
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: createSuccessResponse(config.outputSchema),
                    },
                },
                description: `${config.summary} successful`,
            },
            ...CommonErrorResponses,
        },
    });
}

export function createUpdateRoute(config: UpdateRouteConfig) {
    const security = config.requiresAuth 
        ? (config.authType === 'bearerAuth' ? BearerAuthSecurityAlt : BearerAuthSecurity)
        : undefined;

    const paramSchema = config.paramType === 'id' ? IdParamSchema : SlugParamSchema;

    return createRoute({
        method: config.method,
        path: config.path,
        tags: config.tags,
        summary: config.summary,
        description: config.description,
        security,
        request: {
            params: paramSchema,
            body: {
                content: {
                    'application/json': {
                        schema: config.inputSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: createSuccessResponse(config.outputSchema),
                    },
                },
                description: `${config.summary} successful`,
            },
            ...CommonErrorResponses,
        },
    });
}

export function createDeleteRoute(config: DeleteRouteConfig) {
    const security = config.requiresAuth 
        ? (config.authType === 'bearerAuth' ? BearerAuthSecurityAlt : BearerAuthSecurity)
        : undefined;

    const paramSchema = config.paramType === 'id' ? IdParamSchema : SlugParamSchema;

    return createRoute({
        method: config.method,
        path: config.path,
        tags: config.tags,
        summary: config.summary,
        description: config.description,
        security,
        request: {
            params: paramSchema,
        },
        responses: {
            204: {
                description: `${config.summary} successful`,
            },
            ...CommonErrorResponses,
        },
    });
}
