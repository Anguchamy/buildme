CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50)   NOT NULL,
    title       VARCHAR(255)  NOT NULL,
    message     TEXT          NOT NULL,
    read        BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id       ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread   ON notifications(user_id, read) WHERE read = FALSE;