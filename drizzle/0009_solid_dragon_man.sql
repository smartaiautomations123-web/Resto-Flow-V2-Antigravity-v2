CREATE TABLE `ai_action_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userQuery` text NOT NULL,
	`executedSql` text NOT NULL,
	`revertSql` text,
	`status` enum('executed','undone') NOT NULL DEFAULT 'executed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_action_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_action_log` ADD CONSTRAINT `ai_action_log_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;