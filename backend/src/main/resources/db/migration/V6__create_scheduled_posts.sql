CREATE TABLE scheduled_posts (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    social_account_id BIGINT REFERENCES social_accounts(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    published_time TIMESTAMP WITH TIME ZONE,
    external_post_id VARCHAR(255),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_posts_post_id ON scheduled_posts(post_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX idx_scheduled_posts_status_time ON scheduled_posts(status, scheduled_time);
