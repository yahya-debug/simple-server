// ============================================================
// Drizzle table definitions: users, chirps, refresh_tokens.
// ============================================================
import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";


// ---- Users table ----
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    email: varchar("email", { length: 256 }).unique().notNull(),
    password: varchar("password").notNull(),
    is_chirpy_red: boolean("is_chirpy_red").notNull().default(false),
})
export type NewUser = typeof users.$inferInsert;

// ---- Chirps table ----
export const chirps = pgTable("chirps", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    body: text("body").notNull(),
    userId: uuid("userId").references(() => users.id, { onDelete: 'cascade' }).notNull(),
})
export type NewChirp = typeof chirps.$inferInsert;

// ---- Refresh tokens table ----
export const refresh_tokens = pgTable("refresh_tokens", {
    token: text("token").primaryKey(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires_at: timestamp("expires_at").notNull().default(sql`now() + interval '60 days'`), // expires after 60 days from now
    revoked_at: timestamp("revoked_at"),
})