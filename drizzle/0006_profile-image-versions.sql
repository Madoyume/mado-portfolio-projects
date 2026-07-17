ALTER TABLE `profile` ADD `avatar_version` integer;--> statement-breakpoint
ALTER TABLE `profile` ADD `hero_version` integer;--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `has_avatar`;--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `has_hero`;