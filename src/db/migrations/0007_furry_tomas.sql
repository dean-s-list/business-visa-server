CREATE TABLE `applicants` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`walletAddress` varchar(50) NOT NULL,
	`name` varchar(250) NOT NULL,
	`email` varchar(250) NOT NULL,
	`discordId` varchar(250) NOT NULL,
	`country` varchar(100) NOT NULL,
	`discovery` text NOT NULL,
	`expectation` text NOT NULL,
	`skills` json NOT NULL,
	`expectationDetails` text NOT NULL,
	`projectDetails` text,
	`status` enum('pending','accepted','rejected') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applicants_id` PRIMARY KEY(`id`),
	CONSTRAINT `address_idx` UNIQUE(`walletAddress`),
	CONSTRAINT `email_idx` UNIQUE(`email`)
);
