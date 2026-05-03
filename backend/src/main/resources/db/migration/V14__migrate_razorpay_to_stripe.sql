-- Rename Razorpay columns to Stripe equivalents
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Migrate existing data
UPDATE subscriptions SET stripe_session_id = razorpay_order_id WHERE razorpay_order_id IS NOT NULL;
UPDATE subscriptions SET stripe_payment_intent_id = razorpay_payment_id WHERE razorpay_payment_id IS NOT NULL;

-- Drop old Razorpay columns
ALTER TABLE subscriptions
    DROP COLUMN IF EXISTS razorpay_subscription_id,
    DROP COLUMN IF EXISTS razorpay_payment_id,
    DROP COLUMN IF EXISTS razorpay_order_id;

-- Update payment provider label
UPDATE subscriptions SET payment_provider = 'STRIPE' WHERE payment_provider = 'RAZORPAY';
