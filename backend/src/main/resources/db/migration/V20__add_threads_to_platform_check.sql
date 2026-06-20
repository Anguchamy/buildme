-- The social_accounts.platform column has a CHECK constraint that was created
-- without THREADS in the allowed values list. Drop and recreate it so Threads
-- accounts can be inserted.
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;

ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_platform_check
    CHECK (platform IN (
        'INSTAGRAM',
        'TIKTOK',
        'FACEBOOK',
        'TWITTER',
        'LINKEDIN',
        'YOUTUBE',
        'PINTEREST',
        'THREADS'
    ));
