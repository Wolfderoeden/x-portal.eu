CREATE TABLE `whitelist_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`country` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whitelist_entries_email_unique` ON `whitelist_entries` (`email`);--> statement-breakpoint
CREATE INDEX `whitelist_created_at_idx` ON `whitelist_entries` (`created_at`);