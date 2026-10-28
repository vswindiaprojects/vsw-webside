-- Additive migration for VSW customer profiles, inquiry conversations, notifications and preferences.
USE `vsw solution`;

ALTER TABLE users
  ADD COLUMN company_name VARCHAR(190) NOT NULL DEFAULT '' AFTER phone,
  ADD COLUMN address VARCHAR(255) NOT NULL DEFAULT '' AFTER company_name,
  ADD COLUMN city VARCHAR(120) NOT NULL DEFAULT '' AFTER address,
  ADD COLUMN state VARCHAR(120) NOT NULL DEFAULT '' AFTER city,
  ADD COLUMN country VARCHAR(120) NOT NULL DEFAULT '' AFTER state,
  ADD COLUMN postal_code VARCHAR(20) NOT NULL DEFAULT '' AFTER country,
  ADD COLUMN profile_image VARCHAR(500) NULL AFTER postal_code,
  ADD COLUMN last_login_at DATETIME NULL AFTER updated_at;

ALTER TABLE contact_inquiries
  MODIFY COLUMN status ENUM('Pending','In Progress','Responded','Resolved','Closed','Cancelled') NOT NULL DEFAULT 'Pending';

CREATE TABLE IF NOT EXISTS inquiry_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  inquiry_id INT NOT NULL,
  sender_user_id INT UNSIGNED NULL,
  sender_type ENUM('User','Admin') NOT NULL,
  sender_name VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inquiry_messages_inquiry_created (inquiry_id, created_at),
  CONSTRAINT fk_inquiry_messages_inquiry FOREIGN KEY (inquiry_id) REFERENCES contact_inquiries(id) ON DELETE CASCADE,
  CONSTRAINT fk_inquiry_messages_user FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  inquiry_id INT NULL,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_notifications_user_created (user_id, created_at),
  INDEX idx_user_notifications_unread (user_id, is_read),
  CONSTRAINT fk_user_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_notifications_inquiry FOREIGN KEY (inquiry_id) REFERENCES contact_inquiries(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT UNSIGNED NOT NULL PRIMARY KEY,
  email_notifications TINYINT(1) NOT NULL DEFAULT 1,
  inquiry_notifications TINYINT(1) NOT NULL DEFAULT 1,
  reply_notifications TINYINT(1) NOT NULL DEFAULT 1,
  marketing_emails TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_activity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  inquiry_id INT NULL,
  activity_type VARCHAR(40) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_activity_user_created (user_id, created_at),
  CONSTRAINT fk_user_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_activity_inquiry FOREIGN KEY (inquiry_id) REFERENCES contact_inquiries(id) ON DELETE SET NULL
) ENGINE=InnoDB;
