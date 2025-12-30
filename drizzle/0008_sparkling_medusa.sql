CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`site_name` varchar(255) NOT NULL DEFAULT 'نموذج الذكاء الصناعي للأوقاف',
	`site_description` text,
	`site_language` varchar(10) NOT NULL DEFAULT 'ar',
	`primary_color` varchar(50) DEFAULT '#2563eb',
	`secondary_color` varchar(50) DEFAULT '#10b981',
	`background_color` varchar(50) DEFAULT '#ffffff',
	`text_color` varchar(50) DEFAULT '#1f2937',
	`accent_color` varchar(50) DEFAULT '#f59e0b',
	`heading_font` varchar(255) DEFAULT '''Cairo'', sans-serif',
	`body_font` varchar(255) DEFAULT '''Tajawal'', sans-serif',
	`base_font_size` int DEFAULT 16,
	`logo_url` varchar(1000),
	`favicon_url` varchar(1000),
	`menu_items` text,
	`footer_text` text,
	`show_social_links` boolean DEFAULT true,
	`theme` enum('light','dark','auto') DEFAULT 'light',
	`updated_by` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `site_settings` ADD CONSTRAINT `site_settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;