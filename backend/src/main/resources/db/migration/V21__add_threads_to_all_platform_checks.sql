-- Several tables have platform CHECK constraints that predate the THREADS
-- enum value. Drop and recreate each with the full allowed-values list so
-- THREADS rows can be inserted across the app.

ALTER TABLE scheduled_posts DROP CONSTRAINT IF EXISTS scheduled_posts_platform_check;
ALTER TABLE scheduled_posts ADD CONSTRAINT scheduled_posts_platform_check
    CHECK (platform IN (
        'INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'TWITTER',
        'LINKEDIN', 'YOUTUBE', 'PINTEREST', 'THREADS'
    ));

ALTER TABLE analytics DROP CONSTRAINT IF EXISTS analytics_platform_check;
ALTER TABLE analytics ADD CONSTRAINT analytics_platform_check
    CHECK (platform IN (
        'INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'TWITTER',
        'LINKEDIN', 'YOUTUBE', 'PINTEREST', 'THREADS'
    ));

ALTER TABLE hashtag_sets DROP CONSTRAINT IF EXISTS hashtag_sets_platform_check;
ALTER TABLE hashtag_sets ADD CONSTRAINT hashtag_sets_platform_check
    CHECK (platform IS NULL OR platform IN (
        'INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'TWITTER',
        'LINKEDIN', 'YOUTUBE', 'PINTEREST', 'THREADS'
    ));
