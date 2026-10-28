-- Safe read-only checks for the existing enquiry table.
USE `vsw solution`;

SELECT DATABASE() AS current_database;
SHOW TABLES LIKE 'contact_inquiries';
DESCRIBE contact_inquiries;
DESCRIBE users;
SELECT id, user_id, name, email, phone, company, service, project_brief, status, created_at
FROM contact_inquiries
ORDER BY created_at DESC
LIMIT 20;

SELECT id, name, email, phone, role, status, created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;
