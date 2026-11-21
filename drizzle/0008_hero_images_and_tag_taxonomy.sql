CREATE TABLE `hero_images` (
	`id` text PRIMARY KEY NOT NULL,
	`cloudinary_public_id` text NOT NULL,
	`version` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hero_images_cloudinary_public_id_unique` ON `hero_images` (`cloudinary_public_id`);--> statement-breakpoint
INSERT INTO `hero_images` (`id`, `cloudinary_public_id`, `version`, `sort_order`, `created_at`)
SELECT '00000000-0000-4000-8000-000000000002', 'hero', `hero_version`, 0, `updated_at`
FROM `profile`
WHERE `hero_version` IS NOT NULL;--> statement-breakpoint
CREATE TABLE `tag_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_categories_normalized_name_unique` ON `tag_categories` (`normalized_name`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_category_normalized_name_unique` ON `tags` (`category_id`,`normalized_name`);--> statement-breakpoint
CREATE TABLE `post_tags` (
	`post_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`post_id`, `tag_id`)
);
--> statement-breakpoint
CREATE TABLE `photo_tags` (
	`photo_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`photo_id`, `tag_id`)
);
--> statement-breakpoint
INSERT INTO `tag_categories` (`id`, `name`, `normalized_name`, `sort_order`, `created_at`)
VALUES ('00000000-0000-4000-8000-000000000001', '未分類', '未分類', 0, CURRENT_TIMESTAMP);--> statement-breakpoint
INSERT OR IGNORE INTO `tags` (`id`, `category_id`, `name`, `normalized_name`, `created_at`)
SELECT lower(hex(randomblob(16))), '00000000-0000-4000-8000-000000000001', trim(value), lower(trim(value)), CURRENT_TIMESTAMP
FROM `posts`, json_each(CASE WHEN json_valid(`posts`.`tags`) THEN `posts`.`tags` ELSE '[]' END)
WHERE typeof(value) = 'text' AND trim(value) <> '';--> statement-breakpoint
INSERT OR IGNORE INTO `tags` (`id`, `category_id`, `name`, `normalized_name`, `created_at`)
SELECT lower(hex(randomblob(16))), '00000000-0000-4000-8000-000000000001', trim(value), lower(trim(value)), CURRENT_TIMESTAMP
FROM `photos`, json_each(CASE WHEN json_valid(`photos`.`tags`) THEN `photos`.`tags` ELSE '[]' END)
WHERE typeof(value) = 'text' AND trim(value) <> '';--> statement-breakpoint
INSERT OR IGNORE INTO `post_tags` (`post_id`, `tag_id`)
SELECT `posts`.`id`, `tags`.`id`
FROM `posts`
JOIN json_each(CASE WHEN json_valid(`posts`.`tags`) THEN `posts`.`tags` ELSE '[]' END)
JOIN `tags` ON `tags`.`category_id` = '00000000-0000-4000-8000-000000000001' AND `tags`.`normalized_name` = lower(trim(value))
WHERE typeof(value) = 'text' AND trim(value) <> '';--> statement-breakpoint
INSERT OR IGNORE INTO `photo_tags` (`photo_id`, `tag_id`)
SELECT `photos`.`id`, `tags`.`id`
FROM `photos`
JOIN json_each(CASE WHEN json_valid(`photos`.`tags`) THEN `photos`.`tags` ELSE '[]' END)
JOIN `tags` ON `tags`.`category_id` = '00000000-0000-4000-8000-000000000001' AND `tags`.`normalized_name` = lower(trim(value))
WHERE typeof(value) = 'text' AND trim(value) <> '';--> statement-breakpoint
ALTER TABLE `posts` DROP COLUMN `tags`;--> statement-breakpoint
ALTER TABLE `photos` DROP COLUMN `tags`;
