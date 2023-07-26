CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`walletAddress` varchar(50) NOT NULL,
	`name` varchar(250),
	`email` varchar(250) NOT NULL,
	`profileImage` text,
	`discordId` varchar(250) NOT NULL,
	`country` varchar(100),
	`nftType` enum('business','member') NOT NULL,
	`role` enum('master-admin','admin','client','user') DEFAULT 'user',
	`nftId` int,
	`nftExpiresAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `address_idx` UNIQUE(`walletAddress`)
);
