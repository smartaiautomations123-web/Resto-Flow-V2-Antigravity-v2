CREATE TABLE `analytics_dashboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`widgets` text,
	`refreshInterval` int DEFAULT 300,
	`isDefault` boolean DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analytics_dashboard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('sales','inventory','labour','customer','financial','custom') NOT NULL,
	`filters` text,
	`columns` text,
	`sortBy` varchar(64),
	`sortOrder` enum('asc','desc') DEFAULT 'asc',
	`isPublic` boolean DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forecasting_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`dayOfWeek` varchar(10) NOT NULL,
	`forecastedRevenue` decimal(12,2) DEFAULT '0',
	`actualRevenue` decimal(12,2),
	`forecastedOrders` int DEFAULT 0,
	`actualOrders` int,
	`confidence` decimal(5,2) DEFAULT '0',
	`accuracy` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forecasting_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`status` enum('success','failed','pending') DEFAULT 'pending',
	`message` text,
	`requestData` text,
	`responseData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('slack','teams','quickbooks','stripe','square','paypal','uber_eats','doordash','grubhub','webhook') NOT NULL,
	`name` varchar(255) NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`apiKey` text,
	`apiSecret` text,
	`webhookUrl` text,
	`webhookSecret` text,
	`config` text,
	`lastSyncAt` timestamp,
	`lastErrorAt` timestamp,
	`lastErrorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`totalRevenue` decimal(12,2) DEFAULT '0',
	`totalOrders` int DEFAULT 0,
	`averageOrderValue` decimal(10,2) DEFAULT '0',
	`customerCount` int DEFAULT 0,
	`newCustomers` int DEFAULT 0,
	`repeatCustomers` int DEFAULT 0,
	`labourCost` decimal(12,2) DEFAULT '0',
	`foodCost` decimal(12,2) DEFAULT '0',
	`primeCost` decimal(10,2) DEFAULT '0',
	`netProfit` decimal(12,2) DEFAULT '0',
	`profitMargin` decimal(5,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kpi_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`format` enum('pdf','excel','csv','json') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text,
	`fileSize` int,
	`status` enum('pending','completed','failed') DEFAULT 'pending',
	`exportedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_exports_id` PRIMARY KEY(`id`)
);
