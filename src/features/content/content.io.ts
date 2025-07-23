import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import {
    ApiResponseSchema,
    ApiErrorResponseSchema,
    StatusSchema,
    SlugParamSchema,
    PaginationQuerySchema,
    BearerAuthSecurityAlt,
    CommonErrorResponses,
    createSuccessResponse,
    createPaginatedResponse
} from '../../shared/schemas/common';

// =============== SCHEMAS ===============

// Field validation rules
export const FieldValidationSchema = z.object({
    required: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    unique: z.boolean().optional(),
    enum: z.array(z.string()).optional(),
});

// Field definition in a content model
export const ContentFieldSchema = z.object({
    name: z.string(),
    type: z.enum(['text', 'richtext', 'number', 'boolean', 'date', 'datetime', 'email', 'url', 'slug', 'json', 'reference', 'media', 'select', 'multiselect', 'array']),
    label: z.string().optional(),
    description: z.string().optional(),
    validation: FieldValidationSchema.optional(),
    defaultValue: z.any().optional(),
    referenceTo: z.string().optional(),
    referenceType: z.enum(['one', 'many']).optional(),
    options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    arrayOf: z.enum(['text', 'richtext', 'number', 'boolean', 'date', 'datetime', 'email', 'url', 'slug', 'json', 'reference', 'media', 'select', 'multiselect']).optional(),
    arrayReferenceTo: z.string().optional(),
});

// Content model creation schema
export const CreateContentModelSchema = z.object({
    name: z.string().min(1, 'Model name is required'),
    displayName: z.string().optional(),
    description: z.string().optional(),
    fields: z.array(ContentFieldSchema).min(1, 'At least one field is required'),
    settings: z.object({
        singleton: z.boolean().optional(),
        drafts: z.boolean().optional(),
        versioning: z.boolean().optional(),
        timestamps: z.boolean().optional(),
        slugField: z.string().optional(),
    }).optional(),
});

// Content model update schema
export const UpdateContentModelSchema = CreateContentModelSchema.partial();

// Content item creation schema
export const CreateContentItemSchema = z.object({
    status: StatusSchema.default('draft'),
    data: z.record(z.string(), z.any()),
});

// Content item update schema
export const UpdateContentItemSchema = CreateContentItemSchema.partial();

// Query parameters for content listing
export const ContentQuerySchema = PaginationQuerySchema.extend({
    status: StatusSchema.optional(),
    populate: z.string().optional(),
});

// =============== CONTENT MODEL ROUTES ===============

export const createContentModelRoute = createRoute({
    method: 'post',
    path: '/api/content/models',
    tags: ['Content Models'],
    summary: 'Create a new content model',
    security: BearerAuthSecurityAlt,
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateContentModelSchema,
                },
            },
        },
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: createSuccessResponse(z.any()),
                },
            },
            description: 'Content model created successfully',
        },
        ...CommonErrorResponses,
    },
});

export const listContentModelsRoute = createRoute({
    method: 'get',
    path: '/api/content/models',
    tags: ['Content Models'],
    summary: 'List all content models',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: createSuccessResponse(z.array(z.any())),
                },
            },
            description: 'List of content models',
        },
        ...CommonErrorResponses,
    },
});

export const getContentModelRoute = createRoute({
    method: 'get',
    path: '/api/content/models/{slug}',
    tags: ['Content Models'],
    summary: 'Get content model by slug',
    request: {
        params: SlugParamSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: createSuccessResponse(z.any()),
                },
            },
            description: 'Content model details',
        },
        ...CommonErrorResponses,
    },
});

export const updateContentModelRoute = createRoute({
    method: 'put',
    path: '/api/content/models/{slug}',
    tags: ['Content Models'],
    summary: 'Update content model',
    security: BearerAuthSecurityAlt,
    request: {
        params: SlugParamSchema,
        body: {
            content: {
                'application/json': {
                    schema: UpdateContentModelSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: createSuccessResponse(z.any()),
                },
            },
            description: 'Content model updated successfully',
        },
        ...CommonErrorResponses,
    },
});

export const deleteContentModelRoute = createRoute({
    method: 'delete',
    path: '/api/content/models/{slug}',
    tags: ['Content Models'],
    summary: 'Delete content model',
    security: BearerAuthSecurityAlt,
    request: {
        params: SlugParamSchema,
    },
    responses: {
        204: {
            description: 'Content model deleted successfully',
        },
        ...CommonErrorResponses,
    },
});

// =============== CONTENT ITEM ROUTES ===============

export const createContentItemRoute = createRoute({
    method: 'post',
    path: '/api/content/{model}',
    tags: ['Content Items'],
    summary: 'Create content item',
    security: BearerAuthSecurityAlt,
    request: {
        params: z.object({
            model: z.string(),
        }),
        body: {
            content: {
                'application/json': {
                    schema: CreateContentItemSchema,
                },
            },
        },
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: createSuccessResponse(z.any()),
                },
            },
            description: 'Content item created successfully',
        },
        ...CommonErrorResponses,
    },
});

export const listContentItemsRoute = createRoute({
    method: 'get',
    path: '/api/content/{model}',
    tags: ['Content Items'],
    summary: 'List content items',
    request: {
        params: z.object({
            model: z.string(),
        }),
        query: ContentQuerySchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: createPaginatedResponse(z.any()),
                },
            },
            description: 'List of content items',
        },
        ...CommonErrorResponses,
    },
});

export const getContentItemRoute = createRoute({
    method: 'get',
    path: '/api/content/{model}/{slug}',
    tags: ['Content Items'],
    summary: 'Get content item by slug',
    request: {
        params: z.object({
            model: z.string(),
            slug: z.string(),
        }),
        query: z.object({
            populate: z.string().optional(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: createSuccessResponse(z.any()),
                },
            },
            description: 'Content item details',
        },
        ...CommonErrorResponses,
    },
});

export const updateContentItemRoute = createRoute({
    method: 'put',
    path: '/api/content/{model}/{slug}',
    tags: ['Content Items'],
    summary: 'Update content item',
    security: BearerAuthSecurityAlt,
    request: {
        params: z.object({
            model: z.string(),
            slug: z.string(),
        }),
        body: {
            content: {
                'application/json': {
                    schema: UpdateContentItemSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: createSuccessResponse(z.any()),
                },
            },
            description: 'Content item updated successfully',
        },
        ...CommonErrorResponses,
    },
});

export const deleteContentItemRoute = createRoute({
    method: 'delete',
    path: '/api/content/{model}/{slug}',
    tags: ['Content Items'],
    summary: 'Delete content item',
    security: BearerAuthSecurityAlt,
    request: {
        params: z.object({
            model: z.string(),
            slug: z.string(),
        }),
    },
    responses: {
        204: {
            description: 'Content item deleted successfully',
        },
        ...CommonErrorResponses,
    },
});

// =============== TYPE EXPORTS ===============

export type CreateContentModelInput = z.infer<typeof CreateContentModelSchema>;
export type UpdateContentModelInput = z.infer<typeof UpdateContentModelSchema>;
export type CreateContentItemInput = z.infer<typeof CreateContentItemSchema>;
export type UpdateContentItemInput = z.infer<typeof UpdateContentItemSchema>;
export type ContentQueryInput = z.infer<typeof ContentQuerySchema>;

// Response types
export interface ContentModelResponse {
    id: string;
    name: string;
    slug: string;
    displayName: string;
    description?: string;
    fields: any[];
    settings: any;
    createdAt: string;
    updatedAt: string;
}

export interface ContentItemResponse {
    id: string;
    modelSlug: string;
    slug?: string;
    status: 'draft' | 'published' | 'archived';
    data: Record<string, any>;
    publishedAt?: string;
    authorId: string;
    version: number;
    createdAt: string;
    updatedAt: string;
}

export interface ContentListResponse {
    items: ContentItemResponse[];
    total: number;
    limit?: number;
    offset?: number;
}
