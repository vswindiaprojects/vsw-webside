-- Adds the stable Google subject used to link verified customer sign-ins.
-- One-time migration. It is safe to skip only if both the column and index already exist.
USE `vsw solution`;

ALTER TABLE users
  ADD COLUMN google_sub VARCHAR(255) NULL,
  ADD UNIQUE KEY uq_users_google_sub (google_sub);
