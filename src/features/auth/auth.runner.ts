import { Context } from 'hono';
import { AuthUnit } from './auth.unit';
import { validateRegisterInput, validateLoginInput, validateRefreshTokenInput } from './auth.io';
import { AppError } from '../../shared/types/errors';
import { ApiResponse } from '../../shared/types/base';

export class AuthRunner {
  constructor(private authUnit: AuthUnit) {}

  async register(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = validateRegisterInput(body);
      
      const result = await this.authUnit.register(input);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'User registered successfully'
      };
      
      return c.json(response, 201);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async login(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = validateLoginInput(body);
      
      const result = await this.authUnit.login(input);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Login successful'
      };
      
      return c.json(response, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async refresh(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = validateRefreshTokenInput(body);
      
      const result = await this.authUnit.refreshToken(input.refreshToken);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      };
      
      return c.json(response, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async me(c: Context): Promise<Response> {
    try {
      const token = this.extractToken(c);
      if (!token) {
        throw new AppError('Authorization header missing', 401);
      }
      
      const user = await this.authUnit.verifyToken(token);
      
      const response: ApiResponse = {
        success: true,
        data: { user },
        message: 'User retrieved successfully'
      };
      
      return c.json(response, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  private extractToken(c: Context): string | null {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  private handleError(c: Context, error: any): Response {
    console.error('Auth error:', error);
    
    if (error instanceof AppError) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        message: error.message
      };
      return c.json(response, error.statusCode as any);
    }

    // Handle Zod validation errors
    if (error.errors) {
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        message: error.errors.map((e: any) => e.message).join(', ')
      };
      return c.json(response, 400);
    }

    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    };
    return c.json(response, 500);
  }
}
