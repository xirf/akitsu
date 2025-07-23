import { AuthFx, TokenPayload, TokenPair } from '../../features/auth/auth.fx';
import { User } from '../../shared/types/base';

// @ts-ignore - bcryptjs types might not be available yet
import * as bcrypt from 'bcryptjs';
// @ts-ignore - jsonwebtoken types might not be available yet
import * as jwt from 'jsonwebtoken';

export class D1AuthAdapter implements AuthFx {
  constructor(
    private db: D1Database,
    private jwtSecret: string
  ) {}

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();
    
    return result ? this.mapRowToUser(result) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await this.db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id).first();
    
    return result ? this.mapRowToUser(result) : null;
  }

  async createUser(user: User): Promise<void> {
    await this.db.prepare(`
      INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      user.email,
      user.passwordHash,
      user.role,
      user.isActive ? 1 : 0,
      user.createdAt,
      user.updatedAt
    ).run();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const setClause: string[] = [];
    const values: any[] = [];

    if (updates.email !== undefined) {
      setClause.push('email = ?');
      values.push(updates.email);
    }
    if (updates.passwordHash !== undefined) {
      setClause.push('password_hash = ?');
      values.push(updates.passwordHash);
    }
    if (updates.role !== undefined) {
      setClause.push('role = ?');
      values.push(updates.role);
    }
    if (updates.isActive !== undefined) {
      setClause.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    setClause.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const sql = `UPDATE users SET ${setClause.join(', ')} WHERE id = ?`;
    await this.db.prepare(sql).bind(...values).run();
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateTokens(userId: string): Promise<TokenPair> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const accessTokenExpiry = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour
    const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7); // 7 days

    const accessPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    const refreshPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    };

    const token = jwt.sign(
      { ...accessPayload, exp: accessTokenExpiry },
      this.jwtSecret
    );

    const refreshToken = jwt.sign(
      { ...refreshPayload, exp: refreshTokenExpiry },
      this.jwtSecret
    );

    return {
      token,
      refreshToken,
      expiresAt: accessTokenExpiry * 1000 // Convert to milliseconds
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      if (decoded.type !== 'access') {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      if (decoded.type !== 'refresh') {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  generateId(): string {
    return crypto.randomUUID();
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
