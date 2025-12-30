CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`file_name` varchar(500) NOT NULL,
	`file_key` varchar(1000) NOT NULL,
	`file_url` varchar(1000) NOT NULL,
	`file_size` int NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`category` enum('documents','images','legal','administrative','other') NOT NULL DEFAULT 'documents',
	`uploaded_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `category_idx` ON `files` (`category`);--> statement-breakpoint
CREATE INDEX `uploaded_by_idx` ON `files` (`uploaded_by`);