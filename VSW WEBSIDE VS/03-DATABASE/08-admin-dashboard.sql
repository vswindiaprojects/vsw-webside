-- Additive schema for the VSW admin dashboard. Reuses users, admins and contact_inquiries.
USE `vsw solution`;

CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  location VARCHAR(190) NOT NULL DEFAULT '',
  category VARCHAR(100) NOT NULL DEFAULT 'Other',
  description TEXT NOT NULL,
  client_name VARCHAR(190) NOT NULL DEFAULT '',
  project_value DECIMAL(15,2) NULL,
  start_date DATE NULL,
  completion_date DATE NULL,
  status ENUM('Upcoming','Ongoing','Completed','On Hold','active','inactive') NOT NULL DEFAULT 'Upcoming',
  image VARCHAR(500) NOT NULL DEFAULT '',
  brochure VARCHAR(500) NOT NULL DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  archived_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_status_order (status, display_order),
  INDEX idx_projects_title (title)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(190) NOT NULL DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_images_project (project_id, display_order),
  CONSTRAINT fk_project_images_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image VARCHAR(500) NOT NULL DEFAULT '',
  icon VARCHAR(80) NOT NULL DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_services_status_order (status, display_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS website_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  company_name VARCHAR(190) NOT NULL DEFAULT 'VSW Solutions',
  tagline VARCHAR(255) NOT NULL DEFAULT '',
  about_company TEXT NOT NULL,
  founded_year SMALLINT UNSIGNED NULL,
  email VARCHAR(190) NOT NULL DEFAULT '',
  phone_1 VARCHAR(50) NOT NULL DEFAULT '',
  phone_2 VARCHAR(50) NOT NULL DEFAULT '',
  whatsapp VARCHAR(50) NOT NULL DEFAULT '',
  head_office VARCHAR(500) NOT NULL DEFAULT '',
  branch_office VARCHAR(500) NOT NULL DEFAULT '',
  city VARCHAR(120) NOT NULL DEFAULT '',
  state VARCHAR(120) NOT NULL DEFAULT '',
  country VARCHAR(120) NOT NULL DEFAULT 'India',
  google_map_url VARCHAR(500) NOT NULL DEFAULT '',
  gst_number VARCHAR(40) NOT NULL DEFAULT '',
  cin_number VARCHAR(40) NOT NULL DEFAULT '',
  office_hours VARCHAR(255) NOT NULL DEFAULT '',
  website VARCHAR(255) NOT NULL DEFAULT '',
  facebook VARCHAR(500) NOT NULL DEFAULT '',
  instagram VARCHAR(500) NOT NULL DEFAULT '',
  linkedin VARCHAR(500) NOT NULL DEFAULT '',
  youtube VARCHAR(500) NOT NULL DEFAULT '',
  twitter VARCHAR(500) NOT NULL DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO website_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS website_content (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  page_key VARCHAR(80) NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  content JSON NOT NULL,
  updated_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_website_content_section (page_key, section_key),
  CONSTRAINT fk_website_content_admin FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(50) NOT NULL DEFAULT '',
  subject VARCHAR(190) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status ENUM('Unread','Read','Replied','Closed') NOT NULL DEFAULT 'Unread',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contact_messages_status_date (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inquiry_admin_notes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  inquiry_id INT NOT NULL,
  admin_id INT UNSIGNED NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inquiry_admin_notes (inquiry_id, created_at),
  CONSTRAINT fk_inquiry_admin_notes_inquiry FOREIGN KEY (inquiry_id) REFERENCES contact_inquiries(id) ON DELETE CASCADE,
  CONSTRAINT fk_inquiry_admin_notes_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS media_library (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL UNIQUE,
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  media_type ENUM('image','document') NOT NULL,
  alt_text VARCHAR(255) NOT NULL DEFAULT '',
  related_type ENUM('project','service','banner','gallery','general') NOT NULL DEFAULT 'general',
  related_id INT UNSIGNED NULL,
  uploaded_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_media_related (related_type, related_id),
  CONSTRAINT fk_media_admin FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  media_id BIGINT UNSIGNED NOT NULL,
  related_project_id INT UNSIGNED NULL,
  status ENUM('active','archived') NOT NULL DEFAULT 'active',
  uploaded_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_documents_project (related_project_id, status),
  CONSTRAINT fk_documents_media FOREIGN KEY (media_id) REFERENCES media_library(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_project FOREIGN KEY (related_project_id) REFERENCES projects(id) ON DELETE SET NULL,
  CONSTRAINT fk_documents_admin FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NULL,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(500) NOT NULL,
  entity_type VARCHAR(40) NOT NULL DEFAULT '',
  entity_id BIGINT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_notifications_unread (admin_id, is_read, created_at),
  CONSTRAINT fk_admin_notifications_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE contact_inquiries
  MODIFY status ENUM('New','Contacted','In Discussion','Quoted','Follow-up','Converted','Rejected','Closed','Pending','In Progress','Responded','Resolved','Cancelled') NOT NULL DEFAULT 'New',
  ADD COLUMN budget DECIMAL(15,2) NULL,
  ADD COLUMN follow_up_date DATE NULL,
  ADD COLUMN assigned_admin_id INT UNSIGNED NULL,
  ADD COLUMN archived_at DATETIME NULL,
  ADD INDEX idx_contact_inquiries_status_date (status, created_at),
  ADD CONSTRAINT fk_contact_inquiries_assigned_admin FOREIGN KEY (assigned_admin_id) REFERENCES admins(id) ON DELETE SET NULL;

UPDATE contact_inquiries SET status = 'New' WHERE status = 'Pending';
