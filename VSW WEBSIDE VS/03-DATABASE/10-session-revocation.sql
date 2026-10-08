-- Additive migration: allows logout, password changes and role/status changes
-- to invalidate previously issued stateless JWTs.
USE `vsw solution`;

ALTER TABLE users
  ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER last_login_at;

ALTER TABLE admins
  ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER updated_at;

ALTER TABLE contact_inquiries
  ADD INDEX idx_inquiries_user_created (user_id, created_at),
  ADD INDEX idx_inquiries_user_status_created (user_id, status, created_at);
