import { success, z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import {
    ApiResponseSchema,
    ApiErrorResponseSchema,
    EmailSchema,
    PasswordSchema,
    UserRoleSchema,
    TimestampSchema,
    BearerAuthSecurity,
    CommonErrorResponses,
    createSuccessResponse
} from '../../shared/schemas/common';

// Input schemas
export const RegisterSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    role: UserRoleSchema.default('viewer')
});

export const LoginSchema = z.object({
    email: EmailSchema,
    password: z.string()
        .min(1, 'Password is required')
        .max(128, 'Password too long')
});

export const RefreshTokenSchema = z.object({
    refreshToken: z.string()
        .min(1, 'Refresh token is required')
        .trim()
        .max(1000, 'Refresh token too long')
});

// Output schemas
export const UserResponseSchema = z.object({
    id: z.string(),
    email: z.string(),
    role: UserRoleSchema,
    isActive: z.boolean()
}).merge(TimestampSchema);

export const AuthResponseSchema = z.object({
    user: UserResponseSchema,
    token: z.string(),
    refreshToken: z.string(),
    expiresAt: z.number()
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
                    schema: createSuccessResponse(AuthResponseSchema),
                },
            },
            description: 'User registered successfully',
        },
        409: {
            content: {
                'application/json': {
                    schema: ApiErrorResponseSchema,
                },
            },
            description: 'User already exists',
        },
        ...CommonErrorResponses,
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
                    schema: createSuccessResponse(AuthResponseSchema),
                },
            },
            description: 'Login successful',
        },
        ...CommonErrorResponses,
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
                    schema: createSuccessResponse(AuthResponseSchema),
                },
            },
            description: 'Token refreshed successfully',
        },
        ...CommonErrorResponses,
    },
});

export const meRoute = createRoute({
    method: 'get',
    path: '/api/auth/me',
    tags: ['Authentication'],
    summary: 'Get current user',
    description: 'Get information about the currently authenticated user',
    security: BearerAuthSecurity,
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: createSuccessResponse(z.object({
                        user: UserResponseSchema
                    })),
                },
            },
            description: 'User information retrieved successfully',
        },
        ...CommonErrorResponses,
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
