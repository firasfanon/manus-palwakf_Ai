CREATE TABLE `suggested_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` text NOT NULL,
	`category` enum('legal','fiqh','administrative','historical') NOT NULL,
	`display_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suggested_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `category_idx` ON `suggested_questions` (`category`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `suggested_questions` (`is_active`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `suggested_questions` (`display_order`);