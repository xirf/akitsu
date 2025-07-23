import { success, z } from 'zod';
import { createRoute } from '@hono/zod-openapi';

// Input schemas
export const RegisterSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['admin', 'editor', 'viewer']).default('viewer')
});

export const LoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
});

// Output schemas
export const UserResponseSchema = z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'editor', 'viewer']),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export const AuthResponseSchema = z.object({
    user: UserResponseSchema,
    token: z.string(),
    refreshToken: z.string(),
    expiresAt: z.number()
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
export const registerRoute = createRoute({
    method: 'post',
    path: '/api/auth/register',
    tags: ['Authentication'],
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: RegisterSchema,
                },
            },
        },
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: ApiResponseSchema.extend({
                        data: AuthResponseSchema
                    }),
                },
            },
            description: 'User registered successfully',
        },
        400: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Validation error',
        },
        409: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'User already exists',
        },
    },
});

export const loginRoute = createRoute({
    method: 'post',
    path: '/api/auth/login',
    tags: ['Authentication'],
    summary: 'Login user',
    description: 'Authenticate user with email and password',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: LoginSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ApiResponseSchema.extend({
                        data: AuthResponseSchema
                    }),
                },
            },
            description: 'Login successful',
        },
        401: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Invalid credentials',
        },
    },
});

export const refreshRoute = createRoute({
    method: 'post',
    path: '/api/auth/refresh',
    tags: ['Authentication'],
    summary: 'Refresh access token',
    description: 'Get a new access token using refresh token',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: RefreshTokenSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ApiResponseSchema.extend({
                        data: AuthResponseSchema
                    }),
                },
            },
            description: 'Token refreshed successfully',
        },
        401: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'Invalid refresh token',
        },
    },
});

export const meRoute = createRoute({
    method: 'get',
    path: '/api/auth/me',
    tags: ['Authentication'],
    summary: 'Get current user',
    description: 'Get information about the currently authenticated user',
    security: [
        {
            Bearer: [],
        },
    ],
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ApiResponseSchema.extend({
                        data: z.object({
                            user: UserResponseSchema
                        })
                    }),
                },
            },
            description: 'User information retrieved successfully',
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
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Validation helpers
export function validateRegisterInput(data: unknown): RegisterInput {
    return RegisterSchema.parse(data);
}

export function validateLoginInput(data: unknown): LoginInput {
    return LoginSchema.parse(data);
}

export function validateRefreshTokenInput(data: unknown): RefreshTokenInput {
    return RefreshTokenSchema.parse(data);
}
