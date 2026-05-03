CREATE TABLE `inventory_counts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`locationId` int NOT NULL DEFAULT 1,
	`ingredientId` int NOT NULL,
	`quantityCounted` decimal(10,3) NOT NULL,
	`countedBy` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_counts_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_counts_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `market_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierItemId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'AI_SCANNER',
	`effectiveDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_prices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`ingredientId` int,
	`supplierSku` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`packSize` varchar(128),
	`packPrice` decimal(10,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unit_conversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromUnit` varchar(32) NOT NULL,
	`toUnit` varchar(32) NOT NULL,
	`multiplier` decimal(10,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unit_conversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `integrations` MODIFY COLUMN `type` enum('slack','teams','quickbooks','xero','stripe','square','paypal','uber_eats','doordash','grubhub','webhook','toast','xtra_chef') NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `locationId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `locationId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `itemId` varchar(128);--> statement-breakpoint
ALTER TABLE `ingredients` ADD `baseUom` varchar(32);--> statement-breakpoint
ALTER TABLE `ingredients` ADD `parLevel` decimal(10,3) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `ingredients` ADD `safetyStock` decimal(10,3) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `locations` ADD `latitude` decimal(10,8);--> statement-breakpoint
ALTER TABLE `locations` ADD `longitude` decimal(11,8);--> statement-breakpoint
ALTER TABLE `orders` ADD `locationId` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `orders` ADD `externalOrderId` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `externalPlatform` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `createdBy` varchar(255);--> statement-breakpoint
ALTER TABLE `reservations` ADD `locationId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `tables` ADD `locationId` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `time_clock` ADD `status` enum('Verified','Unverified') DEFAULT 'Verified' NOT NULL;--> statement-breakpoint
ALTER TABLE `waitlist` ADD `locationId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `z_report_items` ADD `locationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `z_report_shifts` ADD `locationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `z_reports` ADD `locationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredients` ADD CONSTRAINT `ingredients_itemId_unique` UNIQUE(`itemId`);--> statement-breakpoint
ALTER TABLE `inventory_counts` ADD CONSTRAINT `inventory_counts_ingredientId_ingredients_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_counts` ADD CONSTRAINT `inventory_counts_countedBy_staff_id_fk` FOREIGN KEY (`countedBy`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `market_prices` ADD CONSTRAINT `market_prices_supplierItemId_supplier_items_id_fk` FOREIGN KEY (`supplierItemId`) REFERENCES `supplier_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_items` ADD CONSTRAINT `supplier_items_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_items` ADD CONSTRAINT `supplier_items_ingredientId_ingredients_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE no action ON UPDATE no action;