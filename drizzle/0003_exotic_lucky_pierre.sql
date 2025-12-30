CREATE TABLE `judicial_rulings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`court` varchar(200) NOT NULL,
	`judge` varchar(200),
	`rulingDate` timestamp NOT NULL,
	`rulingType` enum('initial','appeal','supreme','cassation') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`summary` text NOT NULL,
	`fullText` text,
	`legalPrinciple` text,
	`relatedArticles` text,
	`relatedCases` text,
	`propertyId` int,
	`caseId` int,
	`status` enum('final','appealable','appealed') NOT NULL DEFAULT 'final',
	`tags` text,
	`attachments` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `judicial_rulings_id` PRIMARY KEY(`id`),
	CONSTRAINT `judicial_rulings_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `legal_precedents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`principle` text NOT NULL,
	`description` text NOT NULL,
	`category` enum('waqf_validity','waqf_administration','waqf_termination','property_rights','inheritance','transactions','disputes','general') NOT NULL,
	`sourceRulingId` int,
	`relatedRulings` text,
	`legalBasis` text,
	`shariaBasis` text,
	`applicationScope` text,
	`exceptions` text,
	`practicalImplications` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`tags` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `legal_precedents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ottoman_land_law` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleNumber` int NOT NULL,
	`title` varchar(500),
	`arabicText` text NOT NULL,
	`turkishText` text,
	`englishTranslation` text,
	`category` enum('land_types','ownership','waqf','inheritance','transactions','rights','general') NOT NULL,
	`explanation` text,
	`relatedArticles` text,
	`modernApplication` text,
	`judicialInterpretation` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`tags` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ottoman_land_law_id` PRIMARY KEY(`id`),
	CONSTRAINT `ottoman_land_law_articleNumber_unique` UNIQUE(`articleNumber`)
);
--> statement-breakpoint
CREATE TABLE `waqf_deeds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deedNumber` varchar(100) NOT NULL,
	`deedDate` timestamp NOT NULL,
	`hijriDate` varchar(50),
	`court` varchar(200) NOT NULL,
	`judge` varchar(200),
	`waqifName` varchar(300) NOT NULL,
	`waqifDetails` text,
	`propertyDescription` text NOT NULL,
	`propertyLocation` varchar(500) NOT NULL,
	`propertyBoundaries` text,
	`propertyArea` varchar(100),
	`propertyId` int,
	`waqfType` enum('charitable','family','mixed') NOT NULL,
	`beneficiaries` text NOT NULL,
	`waqifConditions` text,
	`administratorName` varchar(300),
	`administratorConditions` text,
	`fullText` text,
	`summary` text,
	`witnesses` text,
	`attachments` text,
	`status` enum('active','inactive','disputed','archived') NOT NULL DEFAULT 'active',
	`notes` text,
	`tags` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waqf_deeds_id` PRIMARY KEY(`id`),
	CONSTRAINT `waqf_deeds_deedNumber_unique` UNIQUE(`deedNumber`)
);
--> statement-breakpoint
ALTER TABLE `judicial_rulings` ADD CONSTRAINT `judicial_rulings_propertyId_waqf_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `waqf_properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `judicial_rulings` ADD CONSTRAINT `judicial_rulings_caseId_waqf_cases_id_fk` FOREIGN KEY (`caseId`) REFERENCES `waqf_cases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `judicial_rulings` ADD CONSTRAINT `judicial_rulings_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `legal_precedents` ADD CONSTRAINT `legal_precedents_sourceRulingId_judicial_rulings_id_fk` FOREIGN KEY (`sourceRulingId`) REFERENCES `judicial_rulings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `legal_precedents` ADD CONSTRAINT `legal_precedents_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ottoman_land_law` ADD CONSTRAINT `ottoman_land_law_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waqf_deeds` ADD CONSTRAINT `waqf_deeds_propertyId_waqf_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `waqf_properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waqf_deeds` ADD CONSTRAINT `waqf_deeds_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `case_number_idx` ON `judicial_rulings` (`caseNumber`);--> statement-breakpoint
CREATE INDEX `court_idx` ON `judicial_rulings` (`court`);--> statement-breakpoint
CREATE INDEX `ruling_date_idx` ON `judicial_rulings` (`rulingDate`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `legal_precedents` (`category`);--> statement-breakpoint
CREATE INDEX `title_idx` ON `legal_precedents` (`title`);--> statement-breakpoint
CREATE INDEX `article_number_idx` ON `ottoman_land_law` (`articleNumber`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `ottoman_land_law` (`category`);--> statement-breakpoint
CREATE INDEX `deed_number_idx` ON `waqf_deeds` (`deedNumber`);--> statement-breakpoint
CREATE INDEX `deed_date_idx` ON `waqf_deeds` (`deedDate`);--> statement-breakpoint
CREATE INDEX `waqif_name_idx` ON `waqf_deeds` (`waqifName`);