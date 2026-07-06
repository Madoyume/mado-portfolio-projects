ALTER TABLE `posts` ADD `cover_image_id` text;--> statement-breakpoint
UPDATE `posts` SET `cover_image_id` = substr(substr(`cover_image_url`, instr(`cover_image_url`, 'mado/blog/') + length('mado/blog/')), 1, instr(substr(`cover_image_url`, instr(`cover_image_url`, 'mado/blog/') + length('mado/blog/')), '.') - 1) WHERE `cover_image_url` IS NOT NULL AND instr(`cover_image_url`, 'mado/blog/') > 0;--> statement-breakpoint
ALTER TABLE `posts` DROP COLUMN `cover_image_url`;--> statement-breakpoint
ALTER TABLE `profile` ADD `has_avatar` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `has_hero` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `profile` SET `has_avatar` = (`avatar_url` IS NOT NULL), `has_hero` = (`hero_image_url` IS NOT NULL);--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `avatar_url`;--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `hero_image_url`;
