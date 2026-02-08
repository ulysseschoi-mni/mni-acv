CREATE TABLE `dropProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dropId` int NOT NULL,
	`productId` int NOT NULL,
	`limitedQuantity` int,
	`soldQuantity` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dropProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('upcoming','active','ended') DEFAULT 'upcoming',
	`bannerUrl` varchar(255),
	`isPinned` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membershipPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userMembershipId` int NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','paid','failed') DEFAULT 'pending',
	`paymentKey` varchar(255),
	`paidAt` timestamp,
	`failedAt` timestamp,
	`failureReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `membershipPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membershipPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`monthlyPrice` int NOT NULL,
	`discountRate` decimal(5,2) DEFAULT '0',
	`freeShipping` boolean DEFAULT false,
	`benefits` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `membershipPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `membershipPlans_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`totalPrice` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`totalAmount` int NOT NULL,
	`status` enum('pending','paid','failed','cancelled') DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`paymentKey` varchar(255),
	`orderedAt` timestamp NOT NULL DEFAULT (now()),
	`paidAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`imageUrl` varchar(255),
	`category` varchar(50),
	`stock` int DEFAULT 0,
	`status` enum('active','inactive','discontinued') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`recipientName` varchar(100) NOT NULL,
	`recipientPhone` varchar(20) NOT NULL,
	`address` varchar(255) NOT NULL,
	`addressDetail` varchar(255),
	`postalCode` varchar(10),
	`status` enum('pending','preparing','shipped','delivered','returned') DEFAULT 'pending',
	`trackingNumber` varchar(50),
	`shippingCompany` varchar(50),
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipments_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `userMemberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`subscriptionStatus` enum('active','paused','cancelled') DEFAULT 'active',
	`subscriptionId` varchar(255),
	`startDate` timestamp NOT NULL,
	`renewalDate` timestamp NOT NULL,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userMemberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `userMemberships_userId_unique` UNIQUE(`userId`)
);
