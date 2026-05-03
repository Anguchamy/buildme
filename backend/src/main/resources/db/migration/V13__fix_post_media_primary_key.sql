-- Ensure post_media has a proper primary key and unique constraint
-- (table may already have id column from V4; these are safe no-ops if so)

ALTER TABLE post_media ADD COLUMN IF NOT EXISTS id BIGSERIAL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'post_media'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE post_media ADD PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'post_media'::regclass
      AND conname = 'post_media_unique'
  ) THEN
    ALTER TABLE post_media ADD CONSTRAINT post_media_unique UNIQUE (post_id, media_asset_id);
  END IF;
END $$;
