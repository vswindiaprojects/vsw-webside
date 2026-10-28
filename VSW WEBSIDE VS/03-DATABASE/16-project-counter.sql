USE `vsw solution`;

-- Project counter board configuration.
-- The admin edits a private draft; the public website reads only the published
-- snapshot. This mirrors theme_configuration and client_logo_configuration.
CREATE TABLE IF NOT EXISTS project_counter_configuration (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  draft_config JSON NOT NULL,
  published_config JSON NOT NULL,
  draft_revision INT UNSIGNED NOT NULL DEFAULT 1,
  published_revision INT UNSIGNED NOT NULL DEFAULT 1,
  updated_by INT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_counter_configuration_admin FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO project_counter_configuration (id, draft_config, published_config, draft_revision, published_revision)
VALUES (
  1,
  '{
    "visible": true,
    "eyebrow": "Our work in numbers",
    "heading": "Delivering with certainty.",
    "subheading": "A growing record of projects delivered across India with accurate data, coordinated execution and dependable follow-through.",
    "animationEnabled": true,
    "loop": true,
    "duration": 2400,
    "pause": 2600,
    "backgroundStyle": "navy",
    "backgroundColor": "",
    "textColor": "",
    "accentColor": "",
    "decorativeLines": true,
    "hoverEffect": true,
    "mainStat": {"value": 300, "suffix": "+", "label": "Projects Completed"},
    "stats": [
      {"id": "clients", "value": 0, "suffix": "+", "label": "Clients Served", "enabled": false},
      {"id": "years", "value": 0, "suffix": "+", "label": "Years of Experience", "enabled": false},
      {"id": "cities", "value": 0, "suffix": "+", "label": "Cities Covered", "enabled": false}
    ]
  }',
  '{
    "visible": true,
    "eyebrow": "Our work in numbers",
    "heading": "Delivering with certainty.",
    "subheading": "A growing record of projects delivered across India with accurate data, coordinated execution and dependable follow-through.",
    "animationEnabled": true,
    "loop": true,
    "duration": 2400,
    "pause": 2600,
    "backgroundStyle": "navy",
    "backgroundColor": "",
    "textColor": "",
    "accentColor": "",
    "decorativeLines": true,
    "hoverEffect": true,
    "mainStat": {"value": 300, "suffix": "+", "label": "Projects Completed"},
    "stats": [
      {"id": "clients", "value": 0, "suffix": "+", "label": "Clients Served", "enabled": false},
      {"id": "years", "value": 0, "suffix": "+", "label": "Years of Experience", "enabled": false},
      {"id": "cities", "value": 0, "suffix": "+", "label": "Cities Covered", "enabled": false}
    ]
  }',
  1,
  1
)
ON DUPLICATE KEY UPDATE id = id;
