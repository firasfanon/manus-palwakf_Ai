CREATE TABLE `message_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`user_id` int NOT NULL,
	`rating` enum('helpful','not_helpful') NOT NULL,
	`feedback` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `message_ratings` ADD CONSTRAINT `message_ratings_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_ratings` ADD CONSTRAINT `message_ratings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `message_idx` ON `message_ratings` (`message_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `message_ratings` (`user_id`);