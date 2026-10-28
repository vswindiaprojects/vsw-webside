-- Run once against an existing VSW database to enable customer password OTP flows.
USE `vsw solution`;

CREATE TABLE IF NOT EXISTS password_reset_otps (
  user_id INT UNSIGNED NOT NULL PRIMARY KEY,
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_reset_otps_expires (expires_at),
  CONSTRAINT fk_password_reset_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
