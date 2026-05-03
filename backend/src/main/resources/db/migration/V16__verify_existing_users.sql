-- All users who existed before the email verification feature (V15) are
-- considered verified — they registered and logged in successfully already.
UPDATE users SET email_verified = true WHERE email_verified = false;
