ALTER TABLE `files` ADD `linked_entity_type` enum('deed','case','property','none') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `files` ADD `linked_entity_id` int;