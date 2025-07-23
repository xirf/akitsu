import { ContentFx, ContentQueryFilters } from './content.fx';
import { ContentModel, ContentItem } from '../../shared/types/content';
import { NotFoundError, ValidationError, AuthorizationError } from '../../shared/types/errors';
import { 
    CreateContentModelInput, 
    UpdateContentModelInput, 
    CreateContentItemInput, 
    UpdateContentItemInput,
    ContentModelResponse,
    ContentItemResponse,
    ContentListResponse
} from './content.io';

export class ContentUnit {
    constructor(private fx: ContentFx) {}

    // =============== CONTENT MODELS ===============

    async createContentModel(input: CreateContentModelInput, userId: string): Promise<ContentModelResponse> {
        // Validate field definitions
        this.validateFields(input.fields);

        const slug = this.slugify(input.name);
        const now = new Date().toISOString();
        
        const model: ContentModel = {
            id: crypto.randomUUID(),
            name: input.name,
            slug,
            displayName: input.displayName || input.name,
            description: input.description,
            fields: input.fields,
            settings: {
                singleton: false,
                drafts: true,
                versioning: false,
                timestamps: true,
                ...input.settings
            },
            createdAt: now,
            updatedAt: now
        };

        await this.fx.createContentModel(model);

        return {
            id: model.id,
            name: model.name,
            slug: model.slug,
            displayName: model.displayName,
            description: model.description,
            fields: model.fields,
            settings: model.settings,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    async listContentModels(): Promise<ContentModelResponse[]> {
        const models = await this.fx.listContentModels();
        
        return models.map(model => ({
            id: model.id,
            name: model.name,
            slug: model.slug,
            displayName: model.displayName,
            description: model.description,
            fields: model.fields,
            settings: model.settings,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        }));
    }

    async getContentModel(slug: string): Promise<ContentModelResponse> {
        const model = await this.fx.findContentModelBySlug(slug);
        
        if (!model) {
            throw new NotFoundError('Content model not found');
        }

        return {
            id: model.id,
            name: model.name,
            slug: model.slug,
            displayName: model.displayName,
            description: model.description,
            fields: model.fields,
            settings: model.settings,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    async updateContentModel(slug: string, input: UpdateContentModelInput): Promise<ContentModelResponse> {
        const model = await this.fx.findContentModelBySlug(slug);
        
        if (!model) {
            throw new NotFoundError('Content model not found');
        }

        // Validate fields if provided
        if (input.fields) {
            this.validateFields(input.fields);
        }

        const updates: Partial<ContentModel> = {
            ...input,
            updatedAt: new Date().toISOString()
        };

        await this.fx.updateContentModel(model.id, updates);

        // Return updated model
        const updatedModel = await this.fx.findContentModelById(model.id);
        if (!updatedModel) {
            throw new NotFoundError('Failed to retrieve updated content model');
        }

        return {
            id: updatedModel.id,
            name: updatedModel.name,
            slug: updatedModel.slug,
            displayName: updatedModel.displayName,
            description: updatedModel.description,
            fields: updatedModel.fields,
            settings: updatedModel.settings,
            createdAt: updatedModel.createdAt,
            updatedAt: updatedModel.updatedAt
        };
    }

    async deleteContentModel(slug: string): Promise<void> {
        const model = await this.fx.findContentModelBySlug(slug);
        
        if (!model) {
            throw new NotFoundError('Content model not found');
        }

        await this.fx.deleteContentModel(model.id);
    }

    // =============== CONTENT ITEMS ===============

    async createContentItem(modelSlug: string, input: CreateContentItemInput, authorId: string): Promise<ContentItemResponse> {
        const model = await this.fx.findContentModelBySlug(modelSlug);
        if (!model) {
            throw new NotFoundError(`Content model '${modelSlug}' not found`);
        }

        // Validate the data against the model
        const validation = await this.fx.validateContentData(model, input.data);
        if (!validation.valid) {
            throw new ValidationError(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Generate slug if needed
        let slug: string | undefined;
        if (model.settings.slugField && input.data[model.settings.slugField]) {
            slug = await this.fx.generateSlug(input.data[model.settings.slugField], modelSlug);
        }

        const now = new Date().toISOString();
        const item: ContentItem = {
            id: crypto.randomUUID(),
            modelId: model.id,
            modelSlug: model.slug,
            slug,
            status: input.status || 'draft',
            data: this.processFieldData(model.fields, input.data),
            publishedAt: input.status === 'published' ? now : undefined,
            authorId,
            version: 1,
            createdAt: now,
            updatedAt: now
        };

        await this.fx.createContentItem(item);

        return {
            id: item.id,
            modelSlug: item.modelSlug,
            slug: item.slug,
            status: item.status,
            data: item.data,
            publishedAt: item.publishedAt,
            authorId: item.authorId,
            version: item.version,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        };
    }

    async listContentItems(modelSlug: string, filters: ContentQueryFilters = {}): Promise<ContentListResponse> {
        const result = await this.fx.findContentItemsByModel(modelSlug, filters);
        
        const items = result.items.map(item => ({
            id: item.id,
            modelSlug: item.modelSlug,
            slug: item.slug,
            status: item.status,
            data: item.data,
            publishedAt: item.publishedAt,
            authorId: item.authorId,
            version: item.version,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }));

        return {
            items,
            total: result.total,
            limit: filters.limit,
            offset: filters.offset
        };
    }

    async getContentItem(modelSlug: string, slug: string): Promise<ContentItemResponse> {
        const item = await this.fx.findContentItemBySlug(modelSlug, slug);
        
        if (!item) {
            throw new NotFoundError('Content item not found');
        }

        return {
            id: item.id,
            modelSlug: item.modelSlug,
            slug: item.slug,
            status: item.status,
            data: item.data,
            publishedAt: item.publishedAt,
            authorId: item.authorId,
            version: item.version,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        };
    }

    async updateContentItem(modelSlug: string, slug: string, input: UpdateContentItemInput): Promise<ContentItemResponse> {
        const item = await this.fx.findContentItemBySlug(modelSlug, slug);
        
        if (!item) {
            throw new NotFoundError('Content item not found');
        }

        // If updating data, validate against model
        if (input.data) {
            const model = await this.fx.findContentModelById(item.modelId);
            if (!model) {
                throw new NotFoundError('Content model not found');
            }

            const validation = await this.fx.validateContentData(model, input.data);
            if (!validation.valid) {
                throw new ValidationError(`Validation failed: ${validation.errors.join(', ')}`);
            }
        }

        const updates: Partial<ContentItem> = {
            ...input,
            updatedAt: new Date().toISOString(),
            version: item.version + 1
        };

        // Set publishedAt if publishing for the first time
        if (input.status === 'published' && !item.publishedAt) {
            updates.publishedAt = new Date().toISOString();
        }

        await this.fx.updateContentItem(item.id, updates);

        // Return updated item
        const updatedItem = await this.fx.findContentItemById(item.id);
        if (!updatedItem) {
            throw new NotFoundError('Failed to retrieve updated content item');
        }

        return {
            id: updatedItem.id,
            modelSlug: updatedItem.modelSlug,
            slug: updatedItem.slug,
            status: updatedItem.status,
            data: updatedItem.data,
            publishedAt: updatedItem.publishedAt,
            authorId: updatedItem.authorId,
            version: updatedItem.version,
            createdAt: updatedItem.createdAt,
            updatedAt: updatedItem.updatedAt
        };
    }

    async deleteContentItem(modelSlug: string, slug: string): Promise<void> {
        const item = await this.fx.findContentItemBySlug(modelSlug, slug);
        
        if (!item) {
            throw new NotFoundError('Content item not found');
        }

        await this.fx.deleteContentItem(item.id);
    }

    // =============== HELPER METHODS ===============

    private validateFields(fields: any[]): void {
        const fieldNames = new Set<string>();
        
        for (const field of fields) {
            if (fieldNames.has(field.name)) {
                throw new ValidationError(`Duplicate field name: ${field.name}`);
            }
            fieldNames.add(field.name);

            // Validate field type specific rules
            if (field.type === 'reference' && !field.referenceTo) {
                throw new ValidationError(`Reference field '${field.name}' must specify referenceTo`);
            }

            if (['select', 'multiselect'].includes(field.type) && !field.options?.length) {
                throw new ValidationError(`Select field '${field.name}' must have options`);
            }
        }
    }

    private processFieldData(fields: any[], data: Record<string, any>): Record<string, any> {
        const processed: Record<string, any> = {};
        
        for (const field of fields) {
            const value = data[field.name];
            
            if (value === undefined || value === null) {
                if (field.validation?.required) {
                    throw new ValidationError(`Required field '${field.name}' is missing`);
                }
                processed[field.name] = field.defaultValue ?? null;
                continue;
            }

            // Process based on field type
            processed[field.name] = this.processFieldValue(field, value);
        }

        return processed;
    }

    private processFieldValue(field: any, value: any): any {
        switch (field.type) {
            case 'slug':
                return this.slugify(value);
            case 'date':
            case 'datetime':
                return new Date(value).toISOString();
            case 'number':
                return Number(value);
            case 'boolean':
                return Boolean(value);
            case 'json':
                return typeof value === 'string' ? JSON.parse(value) : value;
            default:
                return value;
        }
    }

    private slugify(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
