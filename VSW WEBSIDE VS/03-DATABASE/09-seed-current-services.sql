-- Seed the five real services already shown on the public VSW website.
-- INSERT IGNORE keeps this migration safe if a matching service slug exists.
USE `vsw solution`;

INSERT IGNORE INTO services
  (title, slug, description, icon, display_order, status)
VALUES
  ('Site Surveying & Documentation', 'site-surveying-documentation', 'Accurate site data, measurements and project documentation create the foundation for every successful project.', 'Compass', 1, 'active'),
  ('Design & Space Solutions', 'design-space-solutions', 'Design planning and space solutions that respond to practical project requirements and the way people use a place.', 'DraftingCompass', 2, 'active'),
  ('Project Management', 'project-management', 'Structured planning, execution monitoring and project control across the moving parts of a project.', 'ClipboardList', 3, 'active'),
  ('Turnkey Project Solutions', 'turnkey-project-solutions', 'Integrated execution that brings planning, coordination and project completion together under one clear direction.', 'Construction', 4, 'active'),
  ('Contracts Billing', 'contracts-billing', 'Contracts, billing documentation, quantity-related documentation and commercial coordination for the project.', 'FileText', 5, 'active');
