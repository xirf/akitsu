import { AuthFx } from './auth.fx';
import { User, AuthToken } from '../../shared/types/base';
import { AuthenticationError, ConflictError, ValidationError } from '../../shared/types/errors';
import { RegisterInput, LoginInput, AuthResponse, UserResponse } from './auth.io';

interface LoginAttempt {
  email: string;
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

export class AuthUnit {
  private loginAttempts = new Map<string, LoginAttempt>();
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes
  private readonly attemptWindow = 15 * 60 * 1000; // 15 minutes

  constructor(private fx: AuthFx) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    // Validate email format more strictly
    if (!this.isValidEmail(input.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password strength
    if (!this.isStrongPassword(input.password)) {
      throw new ValidationError('Password must contain at least 8 characters, including uppercase, lowercase, number and special character');
    }

    // Check if user already exists
    const existingUser = await this.fx.findUserByEmail(input.email.toLowerCase().trim());
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
      email: input.email.toLowerCase().trim(),
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
    const email = input.email.toLowerCase().trim();
    
    // Check for account lockout
    if (this.isAccountLocked(email)) {
      throw new AuthenticationError('Account temporarily locked due to multiple failed login attempts. Please try again later.');
    }

    // Find user
    const user = await this.fx.findUserByEmail(email);
    if (!user) {
      // Record failed attempt even for non-existent users to prevent enumeration
      this.recordFailedAttempt(email);
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await this.fx.verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      this.recordFailedAttempt(email);
      throw new AuthenticationError('Invalid credentials');
    }

    // Clear failed attempts on successful login
    this.clearFailedAttempts(email);

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
    if (!refreshToken || refreshToken.trim() === '') {
      throw new AuthenticationError('Refresh token is required');
    }

    const decoded = await this.fx.verifyRefreshToken(refreshToken.trim());
    if (!decoded) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const user = await this.fx.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Additional security: Check if user email matches token
    if (user.email !== decoded.email) {
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
    if (!token || token.trim() === '') {
      throw new AuthenticationError('Token is required');
    }

    const decoded = await this.fx.verifyAccessToken(token.trim());
    if (!decoded) {
      throw new AuthenticationError('Invalid token');
    }

    const user = await this.fx.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid token');
    }

    // Additional security: Check if user email matches token
    if (user.email !== decoded.email) {
      throw new AuthenticationError('Invalid token');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Validate new password strength
    if (!this.isStrongPassword(newPassword)) {
      throw new ValidationError('New password must contain at least 8 characters, including uppercase, lowercase, number and special character');
    }

    // Get user
    const user = await this.fx.findUserById(userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Verify current password
    const isValidPassword = await this.fx.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Check if new password is different from current
    const isSamePassword = await this.fx.verifyPassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Hash new password
    const newPasswordHash = await this.fx.hashPassword(newPassword);

    // Update user password
    await this.fx.updateUser(userId, {
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString()
    });
  }

  async deactivateUser(userId: string): Promise<void> {
    const user = await this.fx.findUserById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    await this.fx.updateUser(userId, {
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    // Clear any failed login attempts for this user
    this.clearFailedAttempts(user.email);
  }

  private sanitizeUser(user: User): UserResponse {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  // Security utility methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private isStrongPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  private isAccountLocked(email: string): boolean {
    const attempt = this.loginAttempts.get(email);
    if (!attempt) return false;

    const now = Date.now();
    
    // Clear old attempts outside the window
    if (now - attempt.lastAttempt > this.attemptWindow) {
      this.loginAttempts.delete(email);
      return false;
    }

    // Check if account is locked
    if (attempt.lockedUntil && now < attempt.lockedUntil) {
      return true;
    }

    // Clear lockout if time has passed
    if (attempt.lockedUntil && now >= attempt.lockedUntil) {
      this.loginAttempts.delete(email);
      return false;
    }

    return false;
  }

  private recordFailedAttempt(email: string): void {
    const now = Date.now();
    const attempt = this.loginAttempts.get(email);

    if (!attempt) {
      this.loginAttempts.set(email, {
        email,
        attempts: 1,
        lastAttempt: now
      });
      return;
    }

    // Reset attempts if outside the window
    if (now - attempt.lastAttempt > this.attemptWindow) {
      this.loginAttempts.set(email, {
        email,
        attempts: 1,
        lastAttempt: now
      });
      return;
    }

    // Increment attempts
    attempt.attempts++;
    attempt.lastAttempt = now;

    // Lock account if max attempts reached
    if (attempt.attempts >= this.maxLoginAttempts) {
      attempt.lockedUntil = now + this.lockoutDuration;
    }

    this.loginAttempts.set(email, attempt);
  }

  private clearFailedAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }
}
