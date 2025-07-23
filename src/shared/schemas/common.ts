import { z } from 'zod';

// Common response schemas
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

export const ApiSuccessResponseSchema = z.object({
    success: z.literal(true),
    data: z.unknown(),
    message: z.string()
});

// Common field types
export const IdParamSchema = z.object({
    id: z.string()
});

export const SlugParamSchema = z.object({
    slug: z.string()
});

// Common validation schemas
export const EmailSchema = z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim()
    .max(254, 'Email address too long');

export const PasswordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    );

export const UserRoleSchema = z.enum(['admin', 'editor', 'viewer']);
export const PermissionSchema = z.enum(['read', 'write', 'admin']);
export const StatusSchema = z.enum(['draft', 'published', 'archived']);

// Common timestamp fields
export const TimestampSchema = z.object({
    createdAt: z.string(),
    updatedAt: z.string()
});

// Pagination schema
export const PaginationQuerySchema = z.object({
    limit: z.string().transform(Number).optional(),
    offset: z.string().transform(Number).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
});

// Security definitions for OpenAPI
export const BearerAuthSecurity = [{ Bearer: [] }];
export const BearerAuthSecurityAlt = [{ bearerAuth: [] }];

// Common response builders
export function createSuccessResponse<T extends z.ZodType>(dataSchema: T) {
    return ApiResponseSchema.extend({
        success: z.literal(true),
        data: dataSchema
    });
}

export function createPaginatedResponse<T extends z.ZodType>(itemSchema: T) {
    return ApiResponseSchema.extend({
        success: z.literal(true),
        data: z.object({
            items: z.array(itemSchema),
            total: z.number(),
            limit: z.number().optional(),
            offset: z.number().optional()
        })
    });
}

// Common error responses for OpenAPI routes
export const CommonErrorResponses = {
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
        description: 'Insufficient permissions',
    },
    404: {
        content: {
            'application/json': {
                schema: ApiErrorResponseSchema,
            },
        },
        description: 'Resource not found',
    },
    500: {
        content: {
            'application/json': {
                schema: ApiErrorResponseSchema,
            },
        },
        description: 'Internal server error',
    }
};

// Type exports
export type ApiResponse<T = unknown> = z.infer<typeof ApiResponseSchema> & { data?: T };
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiSuccessResponse<T = unknown> = z.infer<typeof ApiSuccessResponseSchema> & { data: T };
export type IdParam = z.infer<typeof IdParamSchema>;
export type SlugParam = z.infer<typeof SlugParamSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
