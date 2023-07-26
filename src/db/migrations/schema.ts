import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, unique, serial, varchar, int, timestamp, text, tinyint, mysqlEnum } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"


export const acceptedApplicants = mysqlTable("acceptedApplicants", {
	id: serial("id").notNull(),
	walletAddress: varchar("walletAddress", { length: 50 }).notNull(),
	name: varchar("name", { length: 250 }),
	email: varchar("email", { length: 250 }).notNull(),
	discordId: varchar("discordId", { length: 250 }).notNull(),
	country: varchar("country", { length: 100 }),
	nftId: int("nftId"),
	nftIssuedAt: timestamp("nftIssuedAt", { mode: 'string' }),
	nftExpiresAt: timestamp("nftExpiresAt", { mode: 'string' }),
	nftMintAddress: varchar("nftMintAddress", { length: 50 }),
	nftClaimLink: text("nftClaimLink"),
	hasClaimed: tinyint("hasClaimed").default(0),
	createdAt: timestamp("createdAt", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: 'string' }).onUpdateNow(),
},
(table) => {
	return {
		acceptedApplicantsId: primaryKey(table.id)
		addressIdx: unique("address_idx").on(table.walletAddress),
	}
});

export const users = mysqlTable("users", {
	id: serial("id").notNull(),
	walletAddress: varchar("walletAddress", { length: 50 }).notNull(),
	name: varchar("name", { length: 250 }),
	email: varchar("email", { length: 250 }).notNull(),
	profileImage: text("profileImage"),
	discordId: varchar("discordId", { length: 250 }).notNull(),
	country: varchar("country", { length: 100 }),
	nftType: mysqlEnum("nftType", ['business','member']).notNull(),
	role: mysqlEnum("role", ['master-admin','admin','client','user']).default('user'),
	nftId: int("nftId"),
	nftExpiresAt: timestamp("nftExpiresAt", { mode: 'string' }),
	createdAt: timestamp("createdAt", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updatedAt", { mode: 'string' }).onUpdateNow(),
	nftIssuedAt: timestamp("nftIssuedAt", { mode: 'string' }),
},
(table) => {
	return {
		usersId: primaryKey(table.id)
		addressIdx: unique("address_idx").on(table.walletAddress),
	}
});