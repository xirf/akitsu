import { AuthFx } from './auth.fx';
import { User, AuthToken } from '../../shared/types/base';
import { AuthenticationError, ConflictError, ValidationError } from '../../shared/types/errors';
import { RegisterInput, LoginInput, AuthResponse, UserResponse } from './auth.io';

export class AuthUnit {
  constructor(private fx: AuthFx) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.fx.findUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.fx.hashPassword(input.password);

    // Create user
    const userId = this.fx.generateId();
    const now = new Date().toISOString();
    
    const user: Omit<User, 'id'> & { id: string } = {
      id: userId,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    await this.fx.createUser(user);

    // Generate tokens
    const { token, refreshToken, expiresAt } = await this.fx.generateTokens(userId);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      expiresAt
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await this.fx.findUserByEmail(input.email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await this.fx.verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens
    const { token, refreshToken, expiresAt } = await this.fx.generateTokens(user.id);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      expiresAt
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const decoded = await this.fx.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const user = await this.fx.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.fx.generateTokens(user.id);

    return {
      user: this.sanitizeUser(user),
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt
    };
  }

  async verifyToken(token: string): Promise<User> {
    const decoded = await this.fx.verifyAccessToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid token');
    }

    const user = await this.fx.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid token');
    }

    return user;
  }

  private sanitizeUser(user: User): UserResponse {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
