import type { InferModel } from "drizzle-orm";
import {
    mysqlTable,
    varchar,
    serial,
    uniqueIndex,
    timestamp,
    mysqlEnum,
    int,
    text,
    boolean,
} from "drizzle-orm/mysql-core";

export const usersTable = mysqlTable(
    "users",
    {
        id: serial("id").primaryKey().autoincrement(),
        walletAddress: varchar("walletAddress", { length: 50 }).notNull(),
        name: varchar("name", { length: 250 }),
        email: varchar("email", { length: 250 }).notNull(),
        profileImage: text("profileImage"),
        discordId: varchar("discordId", { length: 250 }).notNull(),
        country: varchar("country", { length: 100 }),
        nftType: mysqlEnum("nftType", ["business", "member"]).notNull(),
        role: mysqlEnum("role", [
            "master-admin",
            "admin",
            "client",
            "user",
        ]).default("user"),
        nftId: int("nftId"),
        nftIssuedAt: timestamp("nftIssuedAt"),
        nftExpiresAt: timestamp("nftExpiresAt"),
        createdAt: timestamp("createdAt").defaultNow(),
        updatedAt: timestamp("updatedAt").onUpdateNow(),
    },
    (users) => ({
        addressIndex: uniqueIndex("address_idx").on(users.walletAddress),
    })
);

export const acceptedApplicantsTable = mysqlTable(
    "acceptedApplicants",
    {
        id: serial("id").primaryKey().autoincrement(),
        walletAddress: varchar("walletAddress", { length: 50 }).notNull(),
        name: varchar("name", { length: 250 }),
        email: varchar("email", { length: 250 }).notNull(),
        discordId: varchar("discordId", { length: 250 }).notNull(),
        country: varchar("country", { length: 100 }),
        nftId: int("nftId"),
        nftIssuedAt: timestamp("nftIssuedAt"),
        nftExpiresAt: timestamp("nftExpiresAt"),
        nftMintAddress: varchar("nftMintAddress", { length: 50 }),
        nftClaimLink: text("nftClaimLink"),
        hasClaimed: boolean("hasClaimed").default(false),
        createdAt: timestamp("createdAt").defaultNow(),
        updatedAt: timestamp("updatedAt").onUpdateNow(),
    },
    (users) => ({
        addressIndex: uniqueIndex("address_idx").on(users.walletAddress),
    })
);

export type User = InferModel<typeof usersTable>;
