ALTER TABLE `acceptedApplicants` ADD CONSTRAINT `email_idx` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `email_idx` UNIQUE(`email`);