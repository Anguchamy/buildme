ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS razorpay_payment_id      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS razorpay_order_id        VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_sub_razorpay_id ON subscriptions(razorpay_subscription_id);
