-- Reduce free tier monthly post limit from 30 to 10
UPDATE subscriptions
SET monthly_post_limit = 10
WHERE plan_type = 'FREE'
  AND monthly_post_limit = 30;
