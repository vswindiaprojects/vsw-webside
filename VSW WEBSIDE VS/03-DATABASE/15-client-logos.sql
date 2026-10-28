USE `vsw solution`;

-- Client logo marquee configuration.
-- The draft snapshot is edited in the admin panel; the published snapshot is what
-- the public website reads. This mirrors the existing theme_configuration pattern.
CREATE TABLE IF NOT EXISTS client_logo_configuration (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  draft_config JSON NOT NULL,
  published_config JSON NOT NULL,
  draft_revision INT UNSIGNED NOT NULL DEFAULT 1,
  published_revision INT UNSIGNED NOT NULL DEFAULT 1,
  updated_by INT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_client_logo_configuration_admin FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO client_logo_configuration (id, draft_config, published_config, draft_revision, published_revision)
VALUES (
  1,
  '{
    "visible": true,
    "eyebrow": "Clients & Partners",
    "heading": "Our Trusted Clients",
    "subheading": "Trusted by leading brands and project partners across India.",
    "speed": 55,
    "direction": "left",
    "animationEnabled": true,
    "pauseOnHover": true,
    "logoSize": 64,
    "gap": 56,
    "cardStyle": "card",
    "grayscale": false,
    "logos": [
      {"id":"placeholder-01","name":"Client Logo 1","imageUrl":"/images/clients/placeholder-01.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-02","name":"Client Logo 2","imageUrl":"/images/clients/placeholder-02.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-03","name":"Client Logo 3","imageUrl":"/images/clients/placeholder-03.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-04","name":"Client Logo 4","imageUrl":"/images/clients/placeholder-04.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-05","name":"Client Logo 5","imageUrl":"/images/clients/placeholder-05.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-06","name":"Client Logo 6","imageUrl":"/images/clients/placeholder-06.svg","alt":"Development placeholder for a client logo","link":"","enabled":true}
    ]
  }',
  '{
    "visible": true,
    "eyebrow": "Clients & Partners",
    "heading": "Our Trusted Clients",
    "subheading": "Trusted by leading brands and project partners across India.",
    "speed": 55,
    "direction": "left",
    "animationEnabled": true,
    "pauseOnHover": true,
    "logoSize": 64,
    "gap": 56,
    "cardStyle": "card",
    "grayscale": false,
    "logos": [
      {"id":"placeholder-01","name":"Client Logo 1","imageUrl":"/images/clients/placeholder-01.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-02","name":"Client Logo 2","imageUrl":"/images/clients/placeholder-02.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-03","name":"Client Logo 3","imageUrl":"/images/clients/placeholder-03.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-04","name":"Client Logo 4","imageUrl":"/images/clients/placeholder-04.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-05","name":"Client Logo 5","imageUrl":"/images/clients/placeholder-05.svg","alt":"Development placeholder for a client logo","link":"","enabled":true},
      {"id":"placeholder-06","name":"Client Logo 6","imageUrl":"/images/clients/placeholder-06.svg","alt":"Development placeholder for a client logo","link":"","enabled":true}
    ]
  }',
  1,
  1
)
ON DUPLICATE KEY UPDATE id = id;
