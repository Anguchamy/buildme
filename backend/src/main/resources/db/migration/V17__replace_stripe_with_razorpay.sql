-- Drop Stripe columns, add Razorpay columns
ALTER TABLE subscriptions
    DROP COLUMN IF EXISTS stripe_session_id,
    DROP COLUMN IF EXISTS stripe_payment_intent_id,
    ADD COLUMN IF NOT EXISTS razorpay_order_id   VARCHAR(255),
    ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
