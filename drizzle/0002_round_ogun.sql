CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int,
	`userId` int,
	`rating` enum('helpful','not_helpful','partially_helpful') NOT NULL,
	`comment` text,
	`suggestedImprovement` text,
	`isReviewed` boolean NOT NULL DEFAULT false,
	`reviewedBy` int,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(1000) NOT NULL,
	`originalResponse` text,
	`improvedResponse` text,
	`improvementReason` text,
	`feedbackCount` int NOT NULL DEFAULT 0,
	`averageRating` varchar(50),
	`category` varchar(100),
	`isApplied` boolean NOT NULL DEFAULT false,
	`appliedBy` int,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ministerial_instructions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instructionNumber` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`type` enum('circular','instruction','decision','regulation','guideline') NOT NULL,
	`category` enum('administrative','financial','legal','technical','general') NOT NULL,
	`issueDate` timestamp NOT NULL,
	`effectiveDate` timestamp,
	`expiryDate` timestamp,
	`issuedBy` varchar(200),
	`attachments` text,
	`relatedInstructions` text,
	`tags` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ministerial_instructions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ministerial_instructions_instructionNumber_unique` UNIQUE(`instructionNumber`)
);
--> statement-breakpoint
CREATE TABLE `waqf_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(100) NOT NULL,
	`propertyId` int,
	`title` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`caseType` enum('ownership_dispute','boundary_dispute','usage_violation','inheritance','management_dispute','encroachment','other') NOT NULL,
	`status` enum('pending','under_investigation','in_court','resolved','closed') NOT NULL DEFAULT 'pending',
	`court` varchar(200),
	`judge` varchar(200),
	`plaintiff` varchar(200),
	`defendant` varchar(200),
	`filingDate` timestamp,
	`hearingDate` timestamp,
	`verdict` text,
	`verdictDate` timestamp,
	`documents` text,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waqf_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `waqf_cases_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `waqf_properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nationalKey` varchar(100) NOT NULL,
	`name` varchar(500) NOT NULL,
	`propertyType` enum('mosque','building','agricultural_land','shrine','cemetery','school','clinic','other') NOT NULL,
	`governorate` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`address` text,
	`area` varchar(100),
	`waqfType` enum('charitable','family','mixed') NOT NULL,
	`status` enum('active','inactive','disputed','under_development') NOT NULL DEFAULT 'active',
	`description` text,
	`documents` text,
	`coordinates` varchar(200),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waqf_properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `waqf_properties_nationalKey_unique` UNIQUE(`nationalKey`)
);
--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_log` ADD CONSTRAINT `learning_log_appliedBy_users_id_fk` FOREIGN KEY (`appliedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ministerial_instructions` ADD CONSTRAINT `ministerial_instructions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waqf_cases` ADD CONSTRAINT `waqf_cases_propertyId_waqf_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `waqf_properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waqf_cases` ADD CONSTRAINT `waqf_cases_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waqf_properties` ADD CONSTRAINT `waqf_properties_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `message_idx` ON `feedback` (`messageId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `feedback` (`userId`);--> statement-breakpoint
CREATE INDEX `rating_idx` ON `feedback` (`rating`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `learning_log` (`category`);--> statement-breakpoint
CREATE INDEX `is_applied_idx` ON `learning_log` (`isApplied`);--> statement-breakpoint
CREATE INDEX `instruction_number_idx` ON `ministerial_instructions` (`instructionNumber`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `ministerial_instructions` (`type`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `ministerial_instructions` (`category`);--> statement-breakpoint
CREATE INDEX `issue_date_idx` ON `ministerial_instructions` (`issueDate`);--> statement-breakpoint
CREATE INDEX `case_number_idx` ON `waqf_cases` (`caseNumber`);--> statement-breakpoint
CREATE INDEX `property_idx` ON `waqf_cases` (`propertyId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `waqf_cases` (`status`);--> statement-breakpoint
CREATE INDEX `case_type_idx` ON `waqf_cases` (`caseType`);--> statement-breakpoint
CREATE INDEX `national_key_idx` ON `waqf_properties` (`nationalKey`);--> statement-breakpoint
CREATE INDEX `governorate_idx` ON `waqf_properties` (`governorate`);--> statement-breakpoint
CREATE INDEX `property_type_idx` ON `waqf_properties` (`propertyType`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `waqf_properties` (`status`);