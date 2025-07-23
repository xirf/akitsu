-- Content models table - stores the schema definitions
CREATE TABLE content_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    fields TEXT NOT NULL, -- JSON string of ContentField[]
    settings TEXT NOT NULL, -- JSON string of model settings
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT NOT NULL REFERENCES users(id)
);

-- Content items table - stores the actual content
CREATE TABLE content_items (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES content_models(id),
    model_slug TEXT NOT NULL, -- Denormalized for performance
    slug TEXT, -- URL-friendly identifier (can be null)
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    data TEXT NOT NULL, -- JSON string of the actual content
    published_at TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    author_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX idx_content_items_model_slug ON content_items(model_slug);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_published_at ON content_items(published_at);
CREATE INDEX idx_content_items_author ON content_items(author_id);

-- Unique constraint for non-null slugs within the same model
CREATE UNIQUE INDEX idx_content_items_model_slug_unique ON content_items(model_slug, slug) WHERE slug IS NOT NULL;

-- Content relationships table - for handling references between content
CREATE TABLE content_relationships (
    id TEXT PRIMARY KEY,
    from_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    to_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL, -- Which field in the source item
    sort_order INTEGER DEFAULT 0, -- For ordered relationships
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(from_item_id, to_item_id, field_name)
);

CREATE INDEX idx_content_relationships_from ON content_relationships(from_item_id, field_name);
CREATE INDEX idx_content_relationships_to ON content_relationships(to_item_id);
