CREATE TABLE `document_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`document_id` int NOT NULL,
	`file_url` varchar(1000) NOT NULL,
	`file_type` enum('original','translation','supplement','other') NOT NULL DEFAULT 'original',
	`file_name` varchar(500),
	`file_size` int,
	`language` varchar(10),
	`extracted_text` text,
	`is_ocr` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `document_files` ADD CONSTRAINT `document_files_document_id_knowledge_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `knowledge_documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `document_idx` ON `document_files` (`document_id`);--> statement-breakpoint
CREATE INDEX `file_type_idx` ON `document_files` (`file_type`);