-- Update user_preferences table to track 2FA status
ALTER TABLE user_preferences 
ADD COLUMN factor_id TEXT,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Create table to store user backup codes for 2FA recovery
CREATE TABLE user_backup_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Row Level Security for backup codes WITH EXPLICIT TYPE CASTING
ALTER TABLE user_backup_codes ENABLE ROW LEVEL SECURITY;

-- Fix policy with explicit type casting
CREATE POLICY "Users can only view their own backup codes" 
  ON user_backup_codes FOR SELECT 
  USING ((auth.uid())::text::integer = user_id);

CREATE POLICY "Users can only insert their own backup codes" 
  ON user_backup_codes FOR INSERT 
  WITH CHECK ((auth.uid())::text::integer = user_id);

CREATE POLICY "Users can only update their own backup codes" 
  ON user_backup_codes FOR UPDATE 
  USING ((auth.uid())::text::integer = user_id);

-- Table to log 2FA verification attempts (optional, for security monitoring)
CREATE TABLE mfa_verification_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  ip_address TEXT,
  user_agent TEXT,
  verification_success BOOLEAN,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a function to automatically mark backup codes as used when they are verified
CREATE OR REPLACE FUNCTION mark_backup_code_as_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_backup_codes
  SET used = TRUE
  WHERE user_id = NEW.user_id AND code = NEW.code AND used = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create an index on user_id and code for faster lookups
CREATE INDEX idx_backup_codes_user_id ON user_backup_codes(user_id);
CREATE INDEX idx_backup_codes_code ON user_backup_codes(code);

-- Create a view for 2FA-enabled users (for admin purposes)
CREATE VIEW users_with_2fa AS
SELECT 
  u.user_id,
  u.email,
  u.name,
  p.two_factor_enabled,
  p.factor_id,
  (SELECT COUNT(*) FROM user_backup_codes WHERE user_id = u.user_id AND used = FALSE) AS remaining_backup_codes
FROM users u
JOIN user_preferences p ON u.user_id = p.user_id
WHERE p.two_factor_enabled = TRUE;