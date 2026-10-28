USE `vsw solution`;

ALTER TABLE media_library
  ADD COLUMN width INT UNSIGNED NULL AFTER media_type,
  ADD COLUMN height INT UNSIGNED NULL AFTER width;
