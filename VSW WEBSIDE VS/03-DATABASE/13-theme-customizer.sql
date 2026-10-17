USE `vsw solution`;

CREATE TABLE IF NOT EXISTS theme_configuration (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  draft_config JSON NOT NULL,
  published_config JSON NOT NULL,
  draft_revision INT UNSIGNED NOT NULL DEFAULT 1,
  published_revision INT UNSIGNED NOT NULL DEFAULT 1,
  updated_by INT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_theme_configuration_admin FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS theme_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  revision INT UNSIGNED NOT NULL,
  configuration JSON NOT NULL,
  change_type ENUM('published','restored') NOT NULL DEFAULT 'published',
  changed_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_theme_versions_revision (revision),
  INDEX idx_theme_versions_created (created_at),
  CONSTRAINT fk_theme_versions_admin FOREIGN KEY (changed_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS theme_presets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  configuration JSON NOT NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_theme_presets_name (name),
  CONSTRAINT fk_theme_presets_admin FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO theme_configuration
  (id, draft_config, published_config, draft_revision, published_revision)
VALUES
  (
    1,
    JSON_OBJECT(
      'colors', JSON_OBJECT(
        'primary', '#07131f',
        'secondary', '#0b1e2e',
        'accent', '#c2a36b',
        'background', '#f4f6f4',
        'text', '#12202a',
        'heading', '#12202a',
        'link', '#c2a36b',
        'buttonBackground', '#c2a36b',
        'buttonText', '#07131f',
        'border', '#d9e0e1',
        'headerBackground', '#07131f',
        'footerBackground', '#07131f',
        'cardBackground', '#ffffff'
      ),
      'typography', JSON_OBJECT(
        'bodyFont', 'DM Sans',
        'headingFont', 'Space Grotesk',
        'bodySize', 16,
        'headingSize', 1
      ),
      'branding', JSON_OBJECT(
        'primaryLogo', '/assets/images/vsw-logo.svg',
        'footerLogo', '/assets/images/vsw-logo.svg',
        'mobileLogo', '/assets/images/vsw-logo.svg',
        'favicon', '',
        'logoAlt', 'VSW Solutions - A Total Solution',
        'logoWidth', 220,
        'logoHref', '#home'
      ),
      'header', JSON_OBJECT(
        'height', 92,
        'sticky', TRUE,
        'showAccount', TRUE,
        'navAlignment', 'right'
      ),
      'footer', JSON_OBJECT(
        'description', '',
        'copyright', '© 2026 VSW Solutions. All Rights Reserved.'
      ),
      'sections', JSON_ARRAY(
        JSON_OBJECT('id', 'hero', 'visible', TRUE, 'order', 0),
        JSON_OBJECT('id', 'strengths', 'visible', TRUE, 'order', 1),
        JSON_OBJECT('id', 'about', 'visible', TRUE, 'order', 2),
        JSON_OBJECT('id', 'services', 'visible', TRUE, 'order', 3),
        JSON_OBJECT('id', 'projects', 'visible', TRUE, 'order', 4),
        JSON_OBJECT('id', 'workflow', 'visible', TRUE, 'order', 5),
        JSON_OBJECT('id', 'why-vsw', 'visible', TRUE, 'order', 6),
        JSON_OBJECT('id', 'contact', 'visible', TRUE, 'order', 7)
      )
    ),
    JSON_OBJECT(
      'colors', JSON_OBJECT(
        'primary', '#07131f',
        'secondary', '#0b1e2e',
        'accent', '#c2a36b',
        'background', '#f4f6f4',
        'text', '#12202a',
        'heading', '#12202a',
        'link', '#c2a36b',
        'buttonBackground', '#c2a36b',
        'buttonText', '#07131f',
        'border', '#d9e0e1',
        'headerBackground', '#07131f',
        'footerBackground', '#07131f',
        'cardBackground', '#ffffff'
      ),
      'typography', JSON_OBJECT(
        'bodyFont', 'DM Sans',
        'headingFont', 'Space Grotesk',
        'bodySize', 16,
        'headingSize', 1
      ),
      'branding', JSON_OBJECT(
        'primaryLogo', '/assets/images/vsw-logo.svg',
        'footerLogo', '/assets/images/vsw-logo.svg',
        'mobileLogo', '/assets/images/vsw-logo.svg',
        'favicon', '',
        'logoAlt', 'VSW Solutions - A Total Solution',
        'logoWidth', 220,
        'logoHref', '#home'
      ),
      'header', JSON_OBJECT(
        'height', 92,
        'sticky', TRUE,
        'showAccount', TRUE,
        'navAlignment', 'right'
      ),
      'footer', JSON_OBJECT(
        'description', '',
        'copyright', '© 2026 VSW Solutions. All Rights Reserved.'
      ),
      'sections', JSON_ARRAY(
        JSON_OBJECT('id', 'hero', 'visible', TRUE, 'order', 0),
        JSON_OBJECT('id', 'strengths', 'visible', TRUE, 'order', 1),
        JSON_OBJECT('id', 'about', 'visible', TRUE, 'order', 2),
        JSON_OBJECT('id', 'services', 'visible', TRUE, 'order', 3),
        JSON_OBJECT('id', 'projects', 'visible', TRUE, 'order', 4),
        JSON_OBJECT('id', 'workflow', 'visible', TRUE, 'order', 5),
        JSON_OBJECT('id', 'why-vsw', 'visible', TRUE, 'order', 6),
        JSON_OBJECT('id', 'contact', 'visible', TRUE, 'order', 7)
      )
    ),
    1,
    1
  );

INSERT IGNORE INTO theme_versions (revision, configuration, change_type)
SELECT published_revision, published_config, 'published'
FROM theme_configuration
WHERE id=1;
