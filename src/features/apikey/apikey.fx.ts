import { ApiKey } from '../../shared/types/base';

export interface ApiKeyFx {
    // API Key management
    createApiKey(apiKey: ApiKey): Promise<void>;
    findApiKeyByHash(hashedKey: string): Promise<ApiKey | null>;
    findApiKeyById(id: string): Promise<ApiKey | null>;
    findApiKeysByUserId(userId: string): Promise<ApiKey[]>;
    updateApiKey(id: string, updates: Partial<ApiKey>): Promise<void>;
    deleteApiKey(id: string): Promise<void>;
    
    // Utility functions
    hashApiKey(apiKey: string): Promise<string>;
    generateApiKey(): string;
    updateLastUsed(id: string): Promise<void>;
}
