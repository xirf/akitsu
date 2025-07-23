import { ApiKeyFx } from './apikey.fx';
import { ApiKey } from '../../shared/types/base';
import { AuthenticationError, NotFoundError, ValidationError, AuthorizationError } from '../../shared/types/errors';
import { CreateApiKeyInput, UpdateApiKeyInput, ApiKeyResponse, ApiKeyListResponse } from './apikey.io';

export class ApiKeyUnit {
    constructor(private fx: ApiKeyFx) {}

    async createApiKey(input: CreateApiKeyInput, userId: string): Promise<ApiKeyResponse> {
        // Generate secure API key
        const apiKey = this.fx.generateApiKey();
        const keyHash = await this.fx.hashApiKey(apiKey);
        
        const now = new Date().toISOString();
        const keyData: ApiKey = {
            id: crypto.randomUUID(),
            name: input.name,
            keyHash,
            permissions: input.permissions,
            rateLimit: input.rateLimit,
            domains: input.domains || [],
            expiresAt: input.expiresAt || null,
            isActive: true,
            userId,
            lastUsedAt: null,
            createdAt: now,
            updatedAt: now
        };

        await this.fx.createApiKey(keyData);

        // Return response with actual API key (only shown once)
        return {
            id: keyData.id,
            name: keyData.name,
            key: apiKey, // Show the actual key only on creation
            permissions: keyData.permissions,
            rateLimit: keyData.rateLimit,
            domains: keyData.domains,
            expiresAt: keyData.expiresAt,
            isActive: keyData.isActive,
            userId: keyData.userId,
            createdAt: keyData.createdAt,
            updatedAt: keyData.updatedAt,
            lastUsedAt: keyData.lastUsedAt
        };
    }

    async listApiKeys(userId: string): Promise<ApiKeyListResponse[]> {
        const apiKeys = await this.fx.findApiKeysByUserId(userId);
        
        return apiKeys.map(key => ({
            id: key.id,
            name: key.name,
            permissions: key.permissions,
            rateLimit: key.rateLimit,
            domains: key.domains,
            expiresAt: key.expiresAt,
            isActive: key.isActive,
            createdAt: key.createdAt,
            lastUsedAt: key.lastUsedAt
        }));
    }

    async getApiKey(id: string, userId: string): Promise<ApiKeyListResponse> {
        const apiKey = await this.fx.findApiKeyById(id);
        
        if (!apiKey) {
            throw new NotFoundError('API key not found');
        }

        if (apiKey.userId !== userId) {
            throw new AuthorizationError('Access denied');
        }

        return {
            id: apiKey.id,
            name: apiKey.name,
            permissions: apiKey.permissions,
            rateLimit: apiKey.rateLimit,
            domains: apiKey.domains,
            expiresAt: apiKey.expiresAt,
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt,
            lastUsedAt: apiKey.lastUsedAt
        };
    }

    async updateApiKey(id: string, input: UpdateApiKeyInput, userId: string): Promise<ApiKeyListResponse> {
        const apiKey = await this.fx.findApiKeyById(id);
        
        if (!apiKey) {
            throw new NotFoundError('API key not found');
        }

        if (apiKey.userId !== userId) {
            throw new AuthorizationError('Access denied');
        }

        const updates: Partial<ApiKey> = {
            ...input,
            updatedAt: new Date().toISOString()
        };

        await this.fx.updateApiKey(id, updates);

        // Return updated key data
        const updatedKey = await this.fx.findApiKeyById(id);
        if (!updatedKey) {
            throw new NotFoundError('Failed to retrieve updated API key');
        }

        return {
            id: updatedKey.id,
            name: updatedKey.name,
            permissions: updatedKey.permissions,
            rateLimit: updatedKey.rateLimit,
            domains: updatedKey.domains,
            expiresAt: updatedKey.expiresAt,
            isActive: updatedKey.isActive,
            createdAt: updatedKey.createdAt,
            lastUsedAt: updatedKey.lastUsedAt
        };
    }

    async deleteApiKey(id: string, userId: string): Promise<void> {
        const apiKey = await this.fx.findApiKeyById(id);
        
        if (!apiKey) {
            throw new NotFoundError('API key not found');
        }

        if (apiKey.userId !== userId) {
            throw new AuthorizationError('Access denied');
        }

        await this.fx.deleteApiKey(id);
    }

    async verifyApiKey(apiKey: string): Promise<ApiKey> {
        const keyHash = await this.fx.hashApiKey(apiKey);
        const keyData = await this.fx.findApiKeyByHash(keyHash);
        
        if (!keyData) {
            throw new AuthenticationError('Invalid API key');
        }

        if (!keyData.isActive) {
            throw new AuthenticationError('API key is deactivated');
        }

        if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
            throw new AuthenticationError('API key expired');
        }

        // Update last used timestamp
        await this.fx.updateLastUsed(keyData.id);

        return keyData;
    }

    async checkPermission(apiKey: ApiKey, requiredPermission: 'read' | 'write' | 'admin'): Promise<boolean> {
        return apiKey.permissions.includes(requiredPermission) || apiKey.permissions.includes('admin');
    }

    async checkDomain(apiKey: ApiKey, domain: string): Promise<boolean> {
        if (apiKey.domains.length === 0) {
            return true; // No domain restrictions
        }
        
        return apiKey.domains.some(allowedDomain => {
            // Support wildcards like *.example.com
            if (allowedDomain.startsWith('*.')) {
                const baseDomain = allowedDomain.substring(2);
                return domain.endsWith(baseDomain);
            }
            return domain === allowedDomain;
        });
    }
}
