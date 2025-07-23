import { ContentModel, ContentItem } from '../../shared/types/content';

export interface ContentFx {
    // Content Model management
    createContentModel(model: ContentModel): Promise<void>;
    findContentModelBySlug(slug: string): Promise<ContentModel | null>;
    findContentModelById(id: string): Promise<ContentModel | null>;
    listContentModels(): Promise<ContentModel[]>;
    updateContentModel(id: string, updates: Partial<ContentModel>): Promise<void>;
    deleteContentModel(id: string): Promise<void>;
    
    // Content Item management
    createContentItem(item: ContentItem): Promise<void>;
    findContentItemBySlug(modelSlug: string, slug: string): Promise<ContentItem | null>;
    findContentItemById(id: string): Promise<ContentItem | null>;
    findContentItemsByModel(modelSlug: string, filters?: ContentQueryFilters): Promise<{ items: ContentItem[]; total: number }>;
    updateContentItem(id: string, updates: Partial<ContentItem>): Promise<void>;
    deleteContentItem(id: string): Promise<void>;
    
    // Utility functions
    generateSlug(text: string, modelSlug: string): Promise<string>;
    validateContentData(model: ContentModel, data: Record<string, any>): Promise<{ valid: boolean; errors: string[] }>;
}

export interface ContentQueryFilters {
    status?: 'draft' | 'published' | 'archived';
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}
