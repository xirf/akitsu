-- Create API keys table
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    permissions TEXT NOT NULL, -- JSON array
    rate_limit INTEGER NOT NULL DEFAULT 1000,
    domains TEXT NOT NULL DEFAULT '[]', -- JSON array
    expires_at TEXT, -- ISO timestamp or NULL for no expiration
    is_active INTEGER NOT NULL DEFAULT 1,
    user_id TEXT NOT NULL,
    last_used_at TEXT, -- ISO timestamp or NULL
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_key_hash ON api_keys (key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX idx_api_keys_is_active ON api_keys (is_active);
CREATE INDEX idx_api_keys_expires_at ON api_keys (expires_at);
