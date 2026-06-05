CREATE TABLE `bans` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	`expires_at` integer
);
--> statement-breakpoint
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`admin_only_post` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`board_id` text NOT NULL,
	`is_op` integer DEFAULT false NOT NULL,
	`author_handle` text,
	`tripcode` text,
	`body` text NOT NULL,
	`image_path` text,
	`thumb_path` text,
	`poster_token` text NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`thread_id`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `posts_thread` ON `posts` (`thread_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `posts_token` ON `posts` (`poster_token`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`reason` text,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`title` text,
	`bumped_at` integer NOT NULL,
	`reply_count` integer DEFAULT 0 NOT NULL,
	`is_locked` integer DEFAULT false NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `threads_board_bump` ON `threads` (`board_id`,`bumped_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_handle_unique` ON `users` (`handle`);