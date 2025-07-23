import { User } from '../../shared/types/base';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  token: string;
  refreshToken: string; 
  expiresAt: number;
}

export interface AuthFx {
  // User operations
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(user: User): Promise<void>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;

  // Password operations
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;

  // Token operations
  generateTokens(userId: string): Promise<TokenPair>;
  verifyAccessToken(token: string): Promise<TokenPayload | null>;
  verifyRefreshToken(token: string): Promise<TokenPayload | null>;

  // Utility
  generateId(): string;
}
