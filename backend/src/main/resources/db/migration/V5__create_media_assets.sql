CREATE TABLE media_assets (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    content_type VARCHAR(100),
    file_size BIGINT,
    s3_key VARCHAR(500),
    url VARCHAR(1000),
    thumbnail_url VARCHAR(1000),
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,
    source VARCHAR(50) DEFAULT 'UPLOAD',
    external_id VARCHAR(255),
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_media_assets_workspace_id ON media_assets(workspace_id);
CREATE INDEX idx_media_assets_source ON media_assets(source);

-- Add FK constraint from post_media to media_assets
ALTER TABLE post_media ADD CONSTRAINT fk_post_media_asset
    FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE CASCADE;
