CREATE TABLE `acceptedApplicants` (
	`id` serial AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`walletAddress` varchar(50) NOT NULL,
	`name` varchar(250),
	`email` varchar(250) NOT NULL,
	`discordId` varchar(250) NOT NULL,
	`country` varchar(100),
	`nftId` int,
	`nftIssuedAt` timestamp,
	`nftExpiresAt` timestamp,
	`nftMintAddress` varchar(50),
	`nftClaimLink` text,
	`hasClaimed` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `address_idx` UNIQUE(`walletAddress`)
);
