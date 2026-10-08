# Database Guide

Use the existing database and table:

- Database: `vsw solution` (the exact name found in local MySQL)
- Table: `contact_inquiries`

Expected columns:

`id`, `name`, `email`, `phone`, `company`, `service`, `project_brief`, `created_at`

Do not import the files in `03-DATABASE/legacy/` for this one-table setup. Use the numbered SQL files only when you need to safely verify or provision a database.

To inspect saved enquiries, run `03-DATABASE/04-test-queries.sql` in MySQL Workbench.
