CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`keyHash` varchar(255) NOT NULL,
	`lastUsed` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `audit_log_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enableAuditLogging` boolean DEFAULT true,
	`logUserActions` boolean DEFAULT true,
	`logDataChanges` boolean DEFAULT true,
	`logLoginAttempts` boolean DEFAULT true,
	`logPayments` boolean DEFAULT true,
	`retentionDays` int DEFAULT 90,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audit_log_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backup_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`autoBackupEnabled` boolean DEFAULT true,
	`backupFrequency` enum('hourly','daily','weekly','monthly') DEFAULT 'daily',
	`backupTime` varchar(5) DEFAULT '02:00',
	`retentionDays` int DEFAULT 30,
	`s3BucketName` varchar(255),
	`s3Enabled` boolean DEFAULT false,
	`lastBackupAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backup_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `currency_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`currencyCode` varchar(3) NOT NULL,
	`currencyName` varchar(64) NOT NULL,
	`currencySymbol` varchar(10) NOT NULL,
	`exchangeRate` decimal(10,4) DEFAULT '1',
	`isEnabled` boolean DEFAULT true,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `currency_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `currency_settings_currencyCode_unique` UNIQUE(`currencyCode`)
);
--> statement-breakpoint
CREATE TABLE `delivery_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`internalDeliveryEnabled` boolean DEFAULT false,
	`thirdPartyDeliveryEnabled` boolean DEFAULT false,
	`defaultDeliveryFee` decimal(10,2) DEFAULT '0',
	`minOrderForDelivery` decimal(10,2) DEFAULT '0',
	`maxDeliveryDistance` int DEFAULT 10,
	`deliveryTimeEstimate` int DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `delivery_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`smtpHost` varchar(255),
	`smtpPort` int DEFAULT 587,
	`smtpUser` varchar(255),
	`smtpPassword` text,
	`fromEmail` varchar(320),
	`fromName` varchar(255),
	`isEnabled` boolean DEFAULT false,
	`useTLS` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `localization_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`language` varchar(10) NOT NULL,
	`languageName` varchar(64) NOT NULL,
	`isEnabled` boolean DEFAULT true,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `localization_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripePublishableKey` varchar(255),
	`stripeSecretKey` text,
	`stripeEnabled` boolean DEFAULT false,
	`squareAccessToken` text,
	`squareEnabled` boolean DEFAULT false,
	`paypalClientId` varchar(255),
	`paypalClientSecret` text,
	`paypalEnabled` boolean DEFAULT false,
	`cashPaymentEnabled` boolean DEFAULT true,
	`checkPaymentEnabled` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receipt_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receiptHeader` text,
	`receiptFooter` text,
	`showItemDescription` boolean DEFAULT true,
	`showItemPrice` boolean DEFAULT true,
	`showTaxBreakdown` boolean DEFAULT true,
	`showDiscounts` boolean DEFAULT true,
	`showPaymentMethod` boolean DEFAULT true,
	`showServerName` boolean DEFAULT true,
	`showTableNumber` boolean DEFAULT true,
	`printLogo` boolean DEFAULT true,
	`receiptWidth` int DEFAULT 80,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receipt_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`twoFactorAuthEnabled` boolean DEFAULT false,
	`ssoEnabled` boolean DEFAULT false,
	`ssoProvider` varchar(64),
	`sessionTimeout` int DEFAULT 3600,
	`passwordMinLength` int DEFAULT 8,
	`passwordRequireUppercase` boolean DEFAULT true,
	`passwordRequireNumbers` boolean DEFAULT true,
	`passwordRequireSpecialChars` boolean DEFAULT true,
	`passwordExpiryDays` int DEFAULT 90,
	`ipWhitelistEnabled` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `security_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantName` varchar(255),
	`restaurantLogo` text,
	`timezone` varchar(64) DEFAULT 'UTC',
	`currency` varchar(3) DEFAULT 'USD',
	`language` varchar(10) DEFAULT 'en',
	`dateFormat` varchar(20) DEFAULT 'MM/DD/YYYY',
	`timeFormat` varchar(20) DEFAULT '12h',
	`taxRate` decimal(5,2) DEFAULT '0',
	`businessLicense` varchar(255),
	`businessPhone` varchar(32),
	`businessEmail` varchar(320),
	`businessAddress` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` enum('light','dark','auto') DEFAULT 'auto',
	`language` varchar(10) DEFAULT 'en',
	`timezone` varchar(64) DEFAULT 'UTC',
	`sidebarCollapsed` boolean DEFAULT false,
	`compactMode` boolean DEFAULT false,
	`showNotifications` boolean DEFAULT true,
	`soundEnabled` boolean DEFAULT true,
	`emailDigest` enum('none','daily','weekly','monthly') DEFAULT 'weekly',
	`defaultLocation` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`)
);
