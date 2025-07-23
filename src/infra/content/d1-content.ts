import { ContentFx, ContentQueryFilters } from '../../features/content';
import { ContentModel, ContentItem, ContentQuery } from '../../shared/types/content';

export class D1ContentRepository implements ContentFx {
  constructor(private db: D1Database) {}

  async createContentModel(model: ContentModel): Promise<void> {
    const id = model.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
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
      'system'
    ).run();
  }

  async findContentModelBySlug(slug: string): Promise<ContentModel | null> {
    const result = await this.db.prepare(`
      SELECT * FROM content_models WHERE slug = ?
    `).bind(slug).first();

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

  async findContentModelById(id: string): Promise<ContentModel | null> {
    const result = await this.db.prepare(`
      SELECT * FROM content_models WHERE id = ?
    `).bind(id).first();

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

  async listContentModels(): Promise<ContentModel[]> {
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

  async updateContentModel(id: string, updates: Partial<ContentModel>): Promise<void> {
    const now = new Date().toISOString();
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
  }

  async deleteContentModel(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM content_models WHERE id = ?').bind(id).run();
  }

  async createContentItem(item: ContentItem): Promise<void> {
    const id = item.id || crypto.randomUUID();
    const now = new Date().toISOString();

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
      item.version || 1,
      item.authorId,
      item.createdAt || now,
      item.updatedAt || now
    ).run();
  }

  async findContentItemBySlug(modelSlug: string, slug: string): Promise<ContentItem | null> {
    const result = await this.db.prepare(`
      SELECT * FROM content_items WHERE model_slug = ? AND slug = ?
    `).bind(modelSlug, slug).first();

    if (!result) return null;

    return {
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
  }

  async findContentItemById(id: string): Promise<ContentItem | null> {
    const result = await this.db.prepare(`
      SELECT * FROM content_items WHERE id = ?
    `).bind(id).first();

    if (!result) return null;

    return {
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
  }

  async findContentItemsByModel(modelSlug: string, filters?: ContentQueryFilters): Promise<{ items: ContentItem[]; total: number; }> {
    let sql = 'SELECT * FROM content_items WHERE model_slug = ?';
    let countSql = 'SELECT COUNT(*) as total FROM content_items WHERE model_slug = ?';
    const values: any[] = [modelSlug];
    const countValues: any[] = [modelSlug];

    if (filters?.status) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      values.push(filters.status);
      countValues.push(filters.status);
    }

    sql += ` ORDER BY ${filters?.sortBy || 'created_at'} ${filters?.sortOrder || 'DESC'}`;
    
    if (filters?.limit) {
      sql += ' LIMIT ?';
      values.push(filters.limit);
      
      if (filters?.offset) {
        sql += ' OFFSET ?';
        values.push(filters.offset);
      }
    }

    const [results, countResult] = await Promise.all([
      this.db.prepare(sql).bind(...values).all(),
      this.db.prepare(countSql).bind(...countValues).first()
    ]);

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

  async updateContentItem(id: string, updates: Partial<ContentItem>): Promise<void> {
    const now = new Date().toISOString();
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
  }

  async deleteContentItem(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM content_items WHERE id = ?').bind(id).run();
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

  async validateContentData(model: ContentModel, data: Record<string, any>): Promise<{ valid: boolean; errors: string[]; }> {
    const errors: string[] = [];

    for (const field of model.fields) {
      const value = data[field.name];

      if (field.validation?.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field.name}' is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

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

      if (field.validation?.min && value.toString().length < field.validation.min) {
        errors.push(`Field '${field.name}' must be at least ${field.validation.min} characters`);
      }
      if (field.validation?.max && value.toString().length > field.validation.max) {
        errors.push(`Field '${field.name}' must be at most ${field.validation.max} characters`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
