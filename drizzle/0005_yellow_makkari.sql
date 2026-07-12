CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email_encrypted` text NOT NULL,
	`comment` text NOT NULL,
	`created_at` text NOT NULL
);
