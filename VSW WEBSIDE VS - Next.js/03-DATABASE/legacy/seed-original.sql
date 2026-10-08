USE vsw_solutions;

INSERT INTO projects (title, client_name, location, category, description, image, status, display_order) VALUES
('Samsung', '', 'Noida, Delhi', 'Corporate', '', '', 'active', 1),
('WOOD KRAFT', '', 'Gurugram, Delhi', 'Commercial', '', '', 'active', 2),
('WeWork', '', 'Kharadi, Pune', 'Corporate', '', '', 'active', 3),
('TCS', '', 'Hinjewadi, Pune', 'Corporate', '', '', 'active', 4),
('Hotel Transit GMR Airport', '', 'Hyderabad', 'Hospitality', '', '', 'active', 5),
('Collective ABFRL', '', 'Santacruz, Mumbai', 'Commercial', '', '', 'active', 6),
('Air India', '', 'Noida, Delhi', 'Corporate', '', '', 'active', 7),
('Vidya Niketan School', '', 'Dombivali, Mumbai', 'Education', '', '', 'active', 8),
('D.Y. Patil College', '', 'Nerul', 'Education', '', '', 'active', 9),
('Vandana Theater', '', 'Thane', 'Other', '', '', 'active', 10),
('Hive Icon 67', '', 'Kandivali, Mumbai', 'Commercial', '', '', 'active', 11),
('New Government Medical College', '', 'Rajkot', 'Healthcare', '', '', 'active', 12),
('Ravindra Bhavan', '', 'Madgaon, Goa', 'Other', '', '', 'active', 13),
('Euro School', '', 'Hennur, Bangalore', 'Education', '', '', 'active', 14),
('Makwana Group', '', 'Pune', 'Commercial', '', '', 'active', 15),
('Mot Realtors', '', 'Koparkhairane, Mumbai', 'Residential', '', '', 'active', 16),
('Mr. Pagdhare House', '', 'Matunga, Mumbai', 'Residential', '', '', 'active', 17),
('Kanakiya High School', '', 'Mira Road', 'Education', '', '', 'active', 18),
('Villa Aventus Tropicana Stays', '', 'Lonavala', 'Hospitality', '', '', 'active', 19),
('Lions Club Chember Hospital', '', '', 'Healthcare', '', '', 'active', 20),
('Apex Kidney Care Dialysis Centres', '', '', 'Healthcare', '', '', 'active', 21);

INSERT INTO services (title, slug, description, icon, display_order, status) VALUES
('Site Surveying & Documentation', 'site-surveying-documentation', 'Accurate site data, measurements and project documentation create the foundation for every successful project.', 'Compass', 1, 'active'),
('Design & Space Solutions', 'design-space-solutions', 'Design planning and space solutions that respond to practical project requirements and the way people use a place.', 'DraftingCompass', 2, 'active'),
('Project Management', 'project-management', 'Structured planning, execution monitoring and project control across the moving parts of a project.', 'ClipboardList', 3, 'active'),
('Turnkey Project Solutions', 'turnkey-project-solutions', 'Integrated execution that brings planning, coordination and project completion together under one clear direction.', 'Construction', 4, 'active'),
('Contracts Billing Services', 'contracts-billing-services', 'Contracts, billing documentation, quantity-related documentation and commercial coordination for the project.', 'FileText', 5, 'active');

INSERT INTO website_settings (id, company_name, tagline, email, phone_1, phone_2, head_office, branch_office, website) VALUES
(1, 'VSW Solutions', 'A Total Solution, Build for the Enthusiast', 'vswindiaprojects@gmail.com', '+91 98672 67499', '+91 91365 14351', 'Shop No. 6, Makkesh Apartment Co-op. HSG. SOC. LTD., Building No. 1 & 2, Near D-Mart Ready, Navghar Road, Bhayander East, Maharashtra, India.', 'Shop No. 1, Mauli Chhaya CHS, Konkani Pada, Kurar Village, Malad (East), Mumbai - 400097, Maharashtra, India.', 'vswsolutions.com');
  