CREATE TABLE `inventory_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ingredientId` int NOT NULL,
	`locationId` int NOT NULL,
	`adjustment_type` varchar(50) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`reason` varchar(255),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`created_by` varchar(255) NOT NULL,
	CONSTRAINT `inventory_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ingredientId` int NOT NULL,
	`locationId` int NOT NULL,
	`current_quantity` decimal(10,2) NOT NULL DEFAULT '0',
	`unit` varchar(50) NOT NULL,
	`reorder_point` decimal(10,2) NOT NULL DEFAULT '0',
	`par_level` decimal(10,2) NOT NULL DEFAULT '0',
	`last_counted_at` timestamp,
	`last_counted_by` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_levels_id` PRIMARY KEY(`id`)
);
