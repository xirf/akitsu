import { ApiKeyFx } from '../../features/apikey/apikey.fx';
import { ApiKey } from '../../shared/types/base';
import { hash } from 'bcryptjs';

export class D1ApiKeyAdapter implements ApiKeyFx {
    constructor(
        private db: D1Database,
        private saltRounds: number = 10
    ) {}

    async createApiKey(apiKey: ApiKey): Promise<void> {
        const stmt = this.db.prepare(`
            INSERT INTO api_keys (
                id, name, key_hash, permissions, rate_limit, domains,
                expires_at, is_active, user_id, last_used_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        await stmt.bind(
            apiKey.id,
            apiKey.name,
            apiKey.keyHash,
            JSON.stringify(apiKey.permissions),
            apiKey.rateLimit,
            JSON.stringify(apiKey.domains),
            apiKey.expiresAt,
            apiKey.isActive ? 1 : 0,
            apiKey.userId,
            apiKey.lastUsedAt,
            apiKey.createdAt,
            apiKey.updatedAt
        ).run();
    }

    async findApiKeyByHash(hashedKey: string): Promise<ApiKey | null> {
        const stmt = this.db.prepare(`
            SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1
        `);

        const result = await stmt.bind(hashedKey).first();
        
        if (!result) {
            return null;
        }

        return this.mapRowToApiKey(result);
    }

    async findApiKeyById(id: string): Promise<ApiKey | null> {
        const stmt = this.db.prepare(`
            SELECT * FROM api_keys WHERE id = ?
        `);

        const result = await stmt.bind(id).first();
        
        if (!result) {
            return null;
        }

        return this.mapRowToApiKey(result);
    }

    async findApiKeysByUserId(userId: string): Promise<ApiKey[]> {
        const stmt = this.db.prepare(`
            SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC
        `);

        const results = await stmt.bind(userId).all();
        
        return results.results?.map(row => this.mapRowToApiKey(row)) || [];
    }

    async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.name !== undefined) {
            fields.push('name = ?');
            values.push(updates.name);
        }

        if (updates.permissions !== undefined) {
            fields.push('permissions = ?');
            values.push(JSON.stringify(updates.permissions));
        }

        if (updates.rateLimit !== undefined) {
            fields.push('rate_limit = ?');
            values.push(updates.rateLimit);
        }

        if (updates.domains !== undefined) {
            fields.push('domains = ?');
            values.push(JSON.stringify(updates.domains));
        }

        if (updates.expiresAt !== undefined) {
            fields.push('expires_at = ?');
            values.push(updates.expiresAt);
        }

        if (updates.isActive !== undefined) {
            fields.push('is_active = ?');
            values.push(updates.isActive ? 1 : 0);
        }

        if (updates.updatedAt !== undefined) {
            fields.push('updated_at = ?');
            values.push(updates.updatedAt);
        }

        if (fields.length === 0) {
            return;
        }

        const stmt = this.db.prepare(`
            UPDATE api_keys SET ${fields.join(', ')} WHERE id = ?
        `);

        values.push(id);
        await stmt.bind(...values).run();
    }

    async deleteApiKey(id: string): Promise<void> {
        const stmt = this.db.prepare(`
            DELETE FROM api_keys WHERE id = ?
        `);

        await stmt.bind(id).run();
    }

    async updateLastUsed(id: string): Promise<void> {
        const stmt = this.db.prepare(`
            UPDATE api_keys SET last_used_at = ? WHERE id = ?
        `);

        await stmt.bind(new Date().toISOString(), id).run();
    }

    async hashApiKey(apiKey: string): Promise<string> {
        return await hash(apiKey, this.saltRounds);
    }

    generateApiKey(): string {
        // Generate a secure API key: cms_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        const prefix = 'cms_live_';
        const keyLength = 32;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        
        let result = prefix;
        for (let i = 0; i < keyLength; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    private mapRowToApiKey(row: any): ApiKey {
        return {
            id: row.id,
            name: row.name,
            keyHash: row.key_hash,
            permissions: JSON.parse(row.permissions || '[]'),
            rateLimit: row.rate_limit,
            domains: JSON.parse(row.domains || '[]'),
            expiresAt: row.expires_at,
            isActive: Boolean(row.is_active),
            userId: row.user_id,
            lastUsedAt: row.last_used_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
