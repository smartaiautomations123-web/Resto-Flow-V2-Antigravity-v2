CREATE TABLE `campaign_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`customerId` int NOT NULL,
	`status` enum('pending','sent','failed','opened','clicked') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('email','sms','push') NOT NULL DEFAULT 'email',
	`subject` varchar(255),
	`content` text NOT NULL,
	`segmentId` int,
	`status` enum('draft','scheduled','sent','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`totalRecipients` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `combo_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`combo_id` int NOT NULL,
	`menu_item_id` int NOT NULL,
	`quantity` int DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `combo_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `combos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location_id` int,
	`name` text NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`regular_price` decimal(10,2),
	`discount` decimal(10,2),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `combos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3b82f6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_sms_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`opt_in_reservations` boolean DEFAULT true,
	`opt_in_waitlist` boolean DEFAULT true,
	`opt_in_order_updates` boolean DEFAULT true,
	`opt_in_promotions` boolean DEFAULT false,
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_sms_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`loyaltyPoints` int DEFAULT 0,
	`totalSpent` decimal(12,2) DEFAULT '0',
	`visitCount` int DEFAULT 0,
	`notes` text,
	`birthday` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dayparts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`start_time` varchar(5) NOT NULL,
	`end_time` varchar(5) NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dayparts_id` PRIMARY KEY(`id`),
	CONSTRAINT `dayparts_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('percentage','fixed','bogo') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`minOrderAmount` decimal(10,2) DEFAULT '0',
	`maxDiscountAmount` decimal(10,2),
	`requiresApproval` boolean DEFAULT false,
	`approvalThreshold` decimal(5,2) DEFAULT '10',
	`isActive` boolean NOT NULL DEFAULT true,
	`validFrom` timestamp,
	`validTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_campaign_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`sent_at` timestamp,
	`opened_at` timestamp,
	`clicked_at` timestamp,
	`converted_at` timestamp,
	CONSTRAINT `email_campaign_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`template_id` int NOT NULL,
	`segment_id` int,
	`status` varchar(20) DEFAULT 'draft',
	`scheduled_at` timestamp,
	`sent_at` timestamp,
	`recipient_count` int DEFAULT 0,
	`open_count` int DEFAULT 0,
	`click_count` int DEFAULT 0,
	`conversion_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`subject` varchar(200) NOT NULL,
	`html_content` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`currentStock` decimal(10,3) DEFAULT '0',
	`minStock` decimal(10,3) DEFAULT '0',
	`costPerUnit` decimal(10,4) DEFAULT '0',
	`supplierId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `item_modifiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuItemId` int NOT NULL,
	`modifierId` int NOT NULL,
	CONSTRAINT `item_modifiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labour_budget` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location_id` int,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`budgeted_hours` decimal(7,2) NOT NULL,
	`budgeted_cost` decimal(12,2) NOT NULL,
	`actual_hours` decimal(7,2) DEFAULT '0',
	`actual_cost` decimal(12,2) DEFAULT '0',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labour_budget_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labour_compliance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location_id` int,
	`max_hours_per_week` int DEFAULT 40,
	`min_break_minutes` int DEFAULT 30,
	`overtime_threshold` int DEFAULT 40,
	`overtime_multiplier` decimal(3,2) DEFAULT '1.5',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labour_compliance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `location_menu_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`menuItemId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `location_menu_prices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`phone` text,
	`email` text,
	`timezone` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_item_dayparts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menu_item_id` int NOT NULL,
	`daypart_id` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `menu_item_dayparts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`cost` decimal(10,2) DEFAULT '0',
	`taxRate` decimal(5,2) DEFAULT '0',
	`imageUrl` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isPopular` boolean NOT NULL DEFAULT false,
	`prepTime` int DEFAULT 10,
	`station` enum('grill','fryer','salad','dessert','bar','general') DEFAULT 'general',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_modifiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(10,2) DEFAULT '0',
	`groupName` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_modifiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`newOrders` boolean DEFAULT true,
	`lowStock` boolean DEFAULT true,
	`staffAlerts` boolean DEFAULT true,
	`systemEvents` boolean DEFAULT true,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(255),
	`message` text,
	`type` varchar(50),
	`relatedId` int,
	`isRead` boolean DEFAULT false,
	`isArchived` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_discounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`discountId` int,
	`discountName` varchar(255) NOT NULL,
	`discountType` enum('percentage','fixed','bogo','manual') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`discountAmount` decimal(10,2) NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_discounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_item_void_reasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_item_id` int NOT NULL,
	`void_reason` enum('customer_request','mistake','damage','comp','other') NOT NULL,
	`notes` text,
	`voided_by` int NOT NULL,
	`voided_at` timestamp DEFAULT (now()),
	CONSTRAINT `order_item_void_reasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`menuItemId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`modifiers` json,
	`status` enum('pending','preparing','ready','served','voided') NOT NULL DEFAULT 'pending',
	`station` varchar(32),
	`notes` text,
	`sentToKitchenAt` timestamp,
	`readyAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_void_reasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`void_reason` enum('customer_request','mistake','damage','comp','other') NOT NULL,
	`notes` text,
	`voided_by` int NOT NULL,
	`voided_at` timestamp DEFAULT (now()),
	CONSTRAINT `order_void_reasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`type` enum('dine_in','takeaway','delivery','collection','online') NOT NULL DEFAULT 'dine_in',
	`status` enum('pending','preparing','ready','served','completed','cancelled','voided') NOT NULL DEFAULT 'pending',
	`tableId` int,
	`staffId` int,
	`customerId` int,
	`customerName` varchar(255),
	`subtotal` decimal(10,2) DEFAULT '0',
	`taxAmount` decimal(10,2) DEFAULT '0',
	`discountAmount` decimal(10,2) DEFAULT '0',
	`serviceCharge` decimal(10,2) DEFAULT '0',
	`tipAmount` decimal(10,2) DEFAULT '0',
	`total` decimal(10,2) DEFAULT '0',
	`paymentMethod` enum('card','cash','split','online','unpaid') DEFAULT 'unpaid',
	`paymentStatus` enum('unpaid','paid','refunded','partial') DEFAULT 'unpaid',
	`voidReason` enum('customer_request','mistake','damage','comp','other'),
	`refundMethod` enum('original_payment','store_credit','cash'),
	`voidRequestedBy` int,
	`voidRequestedAt` timestamp,
	`voidApprovedBy` int,
	`voidApprovedAt` timestamp,
	`voidNotes` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `overtime_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staff_id` int NOT NULL,
	`week_start_date` timestamp NOT NULL,
	`total_hours` decimal(5,2) NOT NULL,
	`overtime_hours` decimal(5,2) NOT NULL,
	`alert_sent` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `overtime_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`transactionId` int,
	`disputeType` enum('chargeback','inquiry','fraud','duplicate','other') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('open','under_review','won','lost','closed') NOT NULL DEFAULT 'open',
	`reason` text,
	`evidence` text,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int,
	`amount` decimal(10,2),
	`currency` varchar(3) DEFAULT 'USD',
	`payment_method` varchar(50),
	`provider` varchar(50),
	`transaction_id` varchar(255),
	`status` varchar(50),
	`refund_amount` decimal(10,2) DEFAULT '0',
	`refund_status` varchar(50),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorProductId` int NOT NULL,
	`uploadId` int,
	`casePrice` decimal(10,2),
	`unitPrice` decimal(10,4),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_upload_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadId` int NOT NULL,
	`vendorCode` varchar(32) NOT NULL,
	`description` text NOT NULL,
	`casePrice` decimal(10,2),
	`unitPrice` decimal(10,4),
	`packSize` varchar(128),
	`calculatedUnitPrice` decimal(10,4),
	`previousCasePrice` decimal(10,2),
	`priceChange` decimal(10,2),
	`isNew` boolean NOT NULL DEFAULT false,
	`vendorProductId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_upload_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`fileUrl` text,
	`dateRangeStart` varchar(10),
	`dateRangeEnd` varchar(10),
	`status` enum('processing','review','applied','failed') NOT NULL DEFAULT 'processing',
	`totalItems` int DEFAULT 0,
	`newItems` int DEFAULT 0,
	`priceChanges` int DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `price_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`quantity` decimal(10,3) NOT NULL,
	`unitCost` decimal(10,4) NOT NULL,
	`totalCost` decimal(10,2) NOT NULL,
	CONSTRAINT `purchase_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`status` enum('draft','sent','received','cancelled') NOT NULL DEFAULT 'draft',
	`totalAmount` decimal(10,2) DEFAULT '0',
	`notes` text,
	`orderedAt` timestamp,
	`receivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qr_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableId` int NOT NULL,
	`qrUrl` text NOT NULL,
	`qrSize` int NOT NULL DEFAULT 200,
	`format` varchar(20) NOT NULL DEFAULT 'png',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qr_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `qr_codes_tableId_unique` UNIQUE(`tableId`)
);
--> statement-breakpoint
CREATE TABLE `recipe_cost_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int,
	`total_cost` decimal(10,2),
	`ingredientCount` int,
	`recordedAt` timestamp DEFAULT (now()),
	CONSTRAINT `recipe_cost_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuItemId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`quantity` decimal(10,4) NOT NULL,
	CONSTRAINT `recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int,
	`guestName` varchar(255) NOT NULL,
	`guestPhone` varchar(32),
	`guestEmail` varchar(320),
	`tableId` int,
	`partySize` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`time` varchar(5) NOT NULL,
	`status` enum('confirmed','seated','completed','cancelled','no_show') NOT NULL DEFAULT 'confirmed',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `segment_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`segmentId` int NOT NULL,
	`customerId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `segment_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`role` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int,
	`phone_number` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`sent_at` timestamp,
	`delivered_at` timestamp,
	`failure_reason` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sms_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurant_id` int NOT NULL,
	`twilio_account_sid` varchar(255),
	`twilio_auth_token` varchar(255),
	`twilio_phone_number` varchar(20),
	`is_enabled` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sms_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `split_bill_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`splitBillId` int NOT NULL,
	`partNumber` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`tipAmount` decimal(10,2) DEFAULT '0',
	`paymentMethod` enum('card','cash','online','unpaid') DEFAULT 'unpaid',
	`paymentStatus` enum('unpaid','paid') DEFAULT 'unpaid',
	`itemIds` json,
	`paidAt` timestamp,
	CONSTRAINT `split_bill_parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `split_bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`splitType` enum('equal','by_item','by_amount','by_percentage') NOT NULL,
	`totalParts` int NOT NULL DEFAULT 2,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `split_bills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`pin` varchar(10),
	`role` enum('owner','manager','server','bartender','kitchen') NOT NULL DEFAULT 'server',
	`hourlyRate` decimal(10,2) DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staff_id` int NOT NULL,
	`day_of_week` int NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_available` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `staff_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int,
	`month` int,
	`year` int,
	`totalOrders` int DEFAULT 0,
	`onTimeDeliveries` int DEFAULT 0,
	`lateDeliveries` int DEFAULT 0,
	`on_time_rate` decimal(5,2) DEFAULT '0',
	`average_price` decimal(10,2) DEFAULT '0',
	`quality_rating` decimal(3,1),
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int,
	`ingredientId` int,
	`price` decimal(10,2),
	`unit` varchar(50),
	`recordedAt` timestamp DEFAULT (now()),
	CONSTRAINT `supplier_price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`email` varchar(320),
	`phone` varchar(32),
	`address` text,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `table_merges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryTableId` int NOT NULL,
	`mergedTableIds` json NOT NULL,
	`mergedBy` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`unmergedAt` timestamp,
	CONSTRAINT `table_merges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`seats` int DEFAULT 4,
	`status` enum('free','occupied','reserved','cleaning') NOT NULL DEFAULT 'free',
	`positionX` int DEFAULT 0,
	`positionY` int DEFAULT 0,
	`section` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `time_clock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`clockIn` timestamp NOT NULL,
	`clockOut` timestamp,
	`breakMinutes` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `time_clock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `time_off_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staff_id` int NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`reason` text,
	`status` text DEFAULT ('pending'),
	`approved_by` int,
	`approved_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `time_off_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vendor_product_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorProductId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vendor_product_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendor_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`vendorCode` varchar(32) NOT NULL,
	`description` text NOT NULL,
	`packSize` varchar(128),
	`packUnit` varchar(32),
	`packQty` decimal(10,4),
	`unitPricePer` varchar(32),
	`currentCasePrice` decimal(10,2) DEFAULT '0',
	`currentUnitPrice` decimal(10,4) DEFAULT '0',
	`lastUpdated` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendor_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `void_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`action` enum('void_requested','void_approved','void_rejected','refund_processed') NOT NULL,
	`reason` varchar(255),
	`refundMethod` enum('original_payment','store_credit','cash'),
	`performedBy` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `void_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int,
	`guestName` varchar(255) NOT NULL,
	`guestPhone` varchar(32),
	`guestEmail` varchar(320),
	`partySize` int NOT NULL,
	`estimatedWaitTime` int DEFAULT 0,
	`status` enum('waiting','called','seated','cancelled') NOT NULL DEFAULT 'waiting',
	`notes` text,
	`position` int NOT NULL,
	`smsNotificationSent` boolean DEFAULT false,
	`smsNotificationSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waitlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waste_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ingredient_id` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`reason` varchar(50) NOT NULL,
	`cost` decimal(10,2) NOT NULL,
	`notes` text,
	`logged_by` int NOT NULL,
	`logged_at` timestamp DEFAULT (now()),
	CONSTRAINT `waste_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waste_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`total_waste_cost` decimal(12,2) NOT NULL,
	`waste_count` int NOT NULL,
	`generated_at` timestamp DEFAULT (now()),
	CONSTRAINT `waste_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `z_report_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`categoryId` int,
	`categoryName` varchar(255),
	`itemCount` int NOT NULL DEFAULT 0,
	`itemRevenue` decimal(12,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `z_report_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `z_report_shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`shiftNumber` int NOT NULL,
	`staffId` int,
	`shiftRevenue` decimal(12,2) NOT NULL DEFAULT '0',
	`shiftOrders` int NOT NULL DEFAULT 0,
	`startTime` timestamp,
	`endTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `z_report_shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `z_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportDate` varchar(10) NOT NULL,
	`totalRevenue` decimal(12,2) NOT NULL DEFAULT '0',
	`totalOrders` int NOT NULL DEFAULT 0,
	`totalDiscounts` decimal(12,2) NOT NULL DEFAULT '0',
	`totalVoids` decimal(12,2) NOT NULL DEFAULT '0',
	`totalTips` decimal(12,2) NOT NULL DEFAULT '0',
	`cashTotal` decimal(12,2) NOT NULL DEFAULT '0',
	`cardTotal` decimal(12,2) NOT NULL DEFAULT '0',
	`splitTotal` decimal(12,2) NOT NULL DEFAULT '0',
	`notes` text,
	`generatedBy` int NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `z_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `combo_items` ADD CONSTRAINT `combo_items_combo_id_combos_id_fk` FOREIGN KEY (`combo_id`) REFERENCES `combos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `combo_items` ADD CONSTRAINT `combo_items_menu_item_id_menu_items_id_fk` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `combos` ADD CONSTRAINT `combos_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_sms_preferences` ADD CONSTRAINT `customer_sms_preferences_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_campaign_recipients` ADD CONSTRAINT `email_campaign_recipients_campaign_id_email_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `email_campaigns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_campaign_recipients` ADD CONSTRAINT `email_campaign_recipients_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_campaigns` ADD CONSTRAINT `email_campaigns_template_id_email_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_campaigns` ADD CONSTRAINT `email_campaigns_segment_id_customer_segments_id_fk` FOREIGN KEY (`segment_id`) REFERENCES `customer_segments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `labour_budget` ADD CONSTRAINT `labour_budget_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `labour_compliance` ADD CONSTRAINT `labour_compliance_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_item_dayparts` ADD CONSTRAINT `menu_item_dayparts_menu_item_id_menu_items_id_fk` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_item_dayparts` ADD CONSTRAINT `menu_item_dayparts_daypart_id_dayparts_id_fk` FOREIGN KEY (`daypart_id`) REFERENCES `dayparts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_item_void_reasons` ADD CONSTRAINT `order_item_void_reasons_order_item_id_order_items_id_fk` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_item_void_reasons` ADD CONSTRAINT `order_item_void_reasons_voided_by_staff_id_fk` FOREIGN KEY (`voided_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_void_reasons` ADD CONSTRAINT `order_void_reasons_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_void_reasons` ADD CONSTRAINT `order_void_reasons_voided_by_staff_id_fk` FOREIGN KEY (`voided_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `overtime_alerts` ADD CONSTRAINT `overtime_alerts_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipe_cost_history` ADD CONSTRAINT `recipe_cost_history_recipeId_recipes_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `recipes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sms_messages` ADD CONSTRAINT `sms_messages_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_availability` ADD CONSTRAINT `staff_availability_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_performance` ADD CONSTRAINT `supplier_performance_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_price_history` ADD CONSTRAINT `supplier_price_history_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_price_history` ADD CONSTRAINT `supplier_price_history_ingredientId_ingredients_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `time_off_requests` ADD CONSTRAINT `time_off_requests_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `time_off_requests` ADD CONSTRAINT `time_off_requests_approved_by_staff_id_fk` FOREIGN KEY (`approved_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waste_logs` ADD CONSTRAINT `waste_logs_ingredient_id_ingredients_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waste_logs` ADD CONSTRAINT `waste_logs_logged_by_staff_id_fk` FOREIGN KEY (`logged_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;