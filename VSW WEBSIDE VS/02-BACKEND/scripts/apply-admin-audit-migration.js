import 'dotenv/config'
import { closePool, query } from '../config/db.js'

try {
  await query(`CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NULL,
    event_type VARCHAR(80) NOT NULL,
    route VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code SMALLINT UNSIGNED NOT NULL,
    ip_address VARCHAR(45) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_activity_actor_date (admin_id, created_at),
    INDEX idx_admin_activity_date (created_at),
    CONSTRAINT fk_admin_activity_logs_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`)
  console.log('Admin activity log table is ready.')
} finally {
  await closePool()
}
