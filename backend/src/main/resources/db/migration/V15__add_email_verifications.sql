CREATE TABLE IF NOT EXISTS email_verifications (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token         VARCHAR(64)  NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    used          BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verif_token   ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verif_user_id ON email_verifications(user_id);
