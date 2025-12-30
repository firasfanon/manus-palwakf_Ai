CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`type` enum('announcement','update','maintenance','alert') NOT NULL,
	`target_audience` enum('all','admins','users','specific') NOT NULL DEFAULT 'all',
	`target_user_ids` text,
	`scheduled_for` timestamp,
	`status` enum('draft','scheduled','sent','cancelled') NOT NULL DEFAULT 'draft',
	`sent_count` int NOT NULL DEFAULT 0,
	`read_count` int NOT NULL DEFAULT 0,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`sent_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registration_enabled` boolean NOT NULL DEFAULT true,
	`daily_question_limit` int NOT NULL DEFAULT 50,
	`require_email_verification` boolean NOT NULL DEFAULT false,
	`welcome_message_enabled` boolean NOT NULL DEFAULT true,
	`welcome_message_title` varchar(500) DEFAULT 'مرحباً بك في نظام الأوقاف الإسلامية',
	`welcome_message_content` text,
	`email_enabled` boolean NOT NULL DEFAULT false,
	`smtp_host` varchar(255),
	`smtp_port` int DEFAULT 587,
	`smtp_user` varchar(255),
	`smtp_password` varchar(255),
	`email_from_address` varchar(255),
	`email_from_name` varchar(255),
	`maintenance_mode` boolean NOT NULL DEFAULT false,
	`maintenance_message` text,
	`updated_by` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`notification_id` int NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `system_settings` ADD CONSTRAINT `system_settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_notification_id_notifications_id_fk` FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `notifications` (`status`);--> statement-breakpoint
CREATE INDEX `scheduled_idx` ON `notifications` (`scheduled_for`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_idx` ON `user_notifications` (`notification_id`);--> statement-breakpoint
CREATE INDEX `read_idx` ON `user_notifications` (`is_read`);