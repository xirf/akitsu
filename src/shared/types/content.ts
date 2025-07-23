import { BaseEntity } from './base';

// Field types that can be used in content models
export type FieldType = 
  | 'text'
  | 'richtext' 
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'slug'
  | 'json'
  | 'reference'
  | 'media'
  | 'select'
  | 'multiselect'
  | 'array';

// Field validation rules
export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  unique?: boolean;
  enum?: string[];
}

// Field definition in a content model
export interface ContentField {
  name: string;
  type: FieldType;
  label?: string;
  description?: string;
  validation?: FieldValidation;
  defaultValue?: any;
  
  // For reference fields
  referenceTo?: string;
  referenceType?: 'one' | 'many';
  
  // For select/multiselect fields
  options?: Array<{ label: string; value: string }>;
  
  // For array fields
  arrayOf?: FieldType;
  arrayReferenceTo?: string;
}

// Content type/model definition
export interface ContentModel extends BaseEntity {
  name: string;           // e.g., "BlogPost"
  slug: string;          // e.g., "blog-post" 
  displayName: string;   // e.g., "Blog Posts"
  description?: string;
  fields: ContentField[];
  
  // Model settings
  settings: {
    singleton?: boolean;     // Only one instance allowed
    drafts?: boolean;       // Support draft/published states
    versioning?: boolean;   // Keep version history
    timestamps?: boolean;   // Auto createdAt/updatedAt
    slugField?: string;     // Which field to use for URL slugs
  };
}

// Actual content instance
export interface ContentItem extends BaseEntity {
  modelId: string;        // Which content model this belongs to
  modelSlug: string;      // Cached for performance
  slug?: string;          // URL-friendly identifier
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  
  // The actual content data (flexible JSON)
  data: Record<string, any>;
  
  // Metadata
  authorId: string;
  version: number;
}

// Content query interface
export interface ContentQuery {
  model?: string;
  status?: ContentItem['status'];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  populate?: string[];    // Which reference fields to populate
}

// Content API responses
export interface ContentModelResponse {
  model: ContentModel;
  totalItems: number;
}

export interface ContentListResponse {
  items: ContentItem[];
  model: ContentModel;
  total: number;
  page: number;
  limit: number;
}
