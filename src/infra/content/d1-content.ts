import { ContentModel, ContentItem, ContentQuery } from '../../shared/types/content';
import { ContentRepository } from '../../features/content/content.service';

export class D1ContentRepository implements ContentRepository {
  constructor(private db: D1Database) {}

  async createModel(model: Omit<ContentModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentModel> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullModel: ContentModel = {
      ...model,
      id,
      createdAt: now,
      updatedAt: now
    };

    await this.db.prepare(`
      INSERT INTO content_models (id, name, slug, display_name, description, fields, settings, created_at, updated_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      model.name,
      model.slug,
      model.displayName,
      model.description || null,
      JSON.stringify(model.fields),
      JSON.stringify(model.settings),
      now,
      now,
      'system' // TODO: Get from context
    ).run();

    return fullModel;
  }

  async getModel(slugOrId: string): Promise<ContentModel | null> {
    const result = await this.db.prepare(`
      SELECT * FROM content_models 
      WHERE slug = ? OR id = ?
    `).bind(slugOrId, slugOrId).first();

    if (!result) return null;

    return {
      id: result.id as string,
      name: result.name as string,
      slug: result.slug as string,
      displayName: result.display_name as string,
      description: result.description as string || undefined,
      fields: JSON.parse(result.fields as string),
      settings: JSON.parse(result.settings as string),
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string
    };
  }

  async listModels(): Promise<ContentModel[]> {
    const results = await this.db.prepare(`
      SELECT * FROM content_models ORDER BY created_at DESC
    `).all();

    if (!results.results) return [];

    return results.results.map(result => ({
      id: result.id as string,
      name: result.name as string,
      slug: result.slug as string,
      displayName: result.display_name as string,
      description: result.description as string || undefined,
      fields: JSON.parse(result.fields as string),
      settings: JSON.parse(result.settings as string),
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string
    }));
  }

  async updateModel(id: string, updates: Partial<ContentModel>): Promise<ContentModel> {
    const now = new Date().toISOString();
    
    // Build dynamic update query
    const setClause: string[] = [];
    const values: any[] = [];
    
    if (updates.name) { setClause.push('name = ?'); values.push(updates.name); }
    if (updates.displayName) { setClause.push('display_name = ?'); values.push(updates.displayName); }
    if (updates.description !== undefined) { setClause.push('description = ?'); values.push(updates.description); }
    if (updates.fields) { setClause.push('fields = ?'); values.push(JSON.stringify(updates.fields)); }
    if (updates.settings) { setClause.push('settings = ?'); values.push(JSON.stringify(updates.settings)); }
    
    setClause.push('updated_at = ?');
    values.push(now, id);

    await this.db.prepare(`
      UPDATE content_models SET ${setClause.join(', ')} WHERE id = ?
    `).bind(...values).run();

    const updated = await this.getModel(id);
    if (!updated) throw new Error('Model not found after update');
    return updated;
  }

  async deleteModel(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM content_models WHERE id = ?').bind(id).run();
  }

  async createItem(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ContentItem> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullItem: ContentItem = {
      ...item,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    await this.db.prepare(`
      INSERT INTO content_items (id, model_id, model_slug, slug, status, data, published_at, version, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      item.modelId,
      item.modelSlug,
      item.slug || null,
      item.status,
      JSON.stringify(item.data),
      item.publishedAt || null,
      1,
      item.authorId,
      now,
      now
    ).run();

    return fullItem;
  }

  async getItem(modelSlug: string, slugOrId: string, populate?: string[]): Promise<ContentItem | null> {
    const result = await this.db.prepare(`
      SELECT * FROM content_items 
      WHERE model_slug = ? AND (slug = ? OR id = ?)
    `).bind(modelSlug, slugOrId, slugOrId).first();

    if (!result) return null;

    const item: ContentItem = {
      id: result.id as string,
      modelId: result.model_id as string,
      modelSlug: result.model_slug as string,
      slug: result.slug as string || undefined,
      status: result.status as ContentItem['status'],
      data: JSON.parse(result.data as string),
      publishedAt: result.published_at as string || undefined,
      version: result.version as number,
      authorId: result.author_id as string,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string
    };

    // TODO: Implement population of reference fields
    if (populate?.length) {
      // This would require additional queries to resolve references
    }

    return item;
  }

  async listItems(query: ContentQuery): Promise<{ items: ContentItem[]; total: number }> {
    let sql = 'SELECT * FROM content_items WHERE 1=1';
    const values: any[] = [];

    if (query.model) {
      sql += ' AND model_slug = ?';
      values.push(query.model);
    }

    if (query.status) {
      sql += ' AND status = ?';
      values.push(query.status);
    }

    // TODO: Implement filters, sorting, pagination
    
    sql += ` ORDER BY ${query.sortBy || 'created_at'} ${query.sortOrder || 'DESC'}`;
    
    if (query.limit) {
      sql += ' LIMIT ?';
      values.push(query.limit);
      
      if (query.offset) {
        sql += ' OFFSET ?';
        values.push(query.offset);
      }
    }

    const results = await this.db.prepare(sql).bind(...values).all();
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM content_items WHERE 1=1';
    const countValues: any[] = [];
    
    if (query.model) {
      countSql += ' AND model_slug = ?';
      countValues.push(query.model);
    }
    if (query.status) {
      countSql += ' AND status = ?';
      countValues.push(query.status);
    }
    
    const countResult = await this.db.prepare(countSql).bind(...countValues).first();
    const total = (countResult?.total as number) || 0;

    if (!results.results) return { items: [], total };

    const items: ContentItem[] = results.results.map(result => ({
      id: result.id as string,
      modelId: result.model_id as string,
      modelSlug: result.model_slug as string,
      slug: result.slug as string || undefined,
      status: result.status as ContentItem['status'],
      data: JSON.parse(result.data as string),
      publishedAt: result.published_at as string || undefined,
      version: result.version as number,
      authorId: result.author_id as string,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string
    }));

    return { items, total };
  }

  async updateItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem> {
    const now = new Date().toISOString();
    
    // Build dynamic update query
    const setClause: string[] = [];
    const values: any[] = [];
    
    if (updates.status) { setClause.push('status = ?'); values.push(updates.status); }
    if (updates.data) { setClause.push('data = ?'); values.push(JSON.stringify(updates.data)); }
    if (updates.publishedAt !== undefined) { setClause.push('published_at = ?'); values.push(updates.publishedAt); }
    if (updates.slug !== undefined) { setClause.push('slug = ?'); values.push(updates.slug); }
    
    setClause.push('updated_at = ?', 'version = version + 1');
    values.push(now, id);

    await this.db.prepare(`
      UPDATE content_items SET ${setClause.join(', ')} WHERE id = ?
    `).bind(...values).run();

    const updated = await this.db.prepare('SELECT * FROM content_items WHERE id = ?').bind(id).first();
    if (!updated) throw new Error('Item not found after update');

    return {
      id: updated.id as string,
      modelId: updated.model_id as string,
      modelSlug: updated.model_slug as string,
      slug: updated.slug as string || undefined,
      status: updated.status as ContentItem['status'],
      data: JSON.parse(updated.data as string),
      publishedAt: updated.published_at as string || undefined,
      version: updated.version as number,
      authorId: updated.author_id as string,
      createdAt: updated.created_at as string,
      updatedAt: updated.updated_at as string
    };
  }

  async deleteItem(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM content_items WHERE id = ?').bind(id).run();
  }

  async validateItemData(model: ContentModel, data: Record<string, any>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const field of model.fields) {
      const value = data[field.name];

      // Check required fields
      if (field.validation?.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field.name}' is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      // Type-specific validation
      switch (field.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(`Field '${field.name}' must be a valid email`);
          }
          break;
        case 'url':
          try { new URL(value); } catch { errors.push(`Field '${field.name}' must be a valid URL`); }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`Field '${field.name}' must be a number`);
          }
          break;
      }

      // Length validation
      if (field.validation?.min && value.length < field.validation.min) {
        errors.push(`Field '${field.name}' must be at least ${field.validation.min} characters`);
      }
      if (field.validation?.max && value.length > field.validation.max) {
        errors.push(`Field '${field.name}' must be at most ${field.validation.max} characters`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async generateSlug(text: string, modelSlug: string): Promise<string> {
    const baseSlug = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness
    while (true) {
      const existing = await this.db.prepare(`
        SELECT id FROM content_items WHERE model_slug = ? AND slug = ?
      `).bind(modelSlug, slug).first();

      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
