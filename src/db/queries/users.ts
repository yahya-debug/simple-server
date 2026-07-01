// ============================================================
// DB query helpers for the users table (create / read / update / delete).
// ============================================================
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { chirps, NewUser, users } from "../schema.js";

// User shape returned to the app, i.e. never leaks the password hash.
export type User_inApp = Omit<NewUser, "password">;

// Insert a new user row (password must already be hashed by the caller).
export async function createUser(user: NewUser) {
    const [result] = await db.insert(users).values(user).returning({
        id: users.id,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        email: users.email,
        isChirpyRed: users.is_chirpy_red,
    });
    return result;
}

// Look up a user by email (used for login).
export async function getUser(email: string) {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
}

// Wipe every user (chirps/refresh tokens cascade-delete with them). Dev-only reset.
export async function deleteAll() {
    const [result] = await db.delete(users).returning();
    return result;
}

// Patch a user row with arbitrary fields (email/password/is_chirpy_red).
export async function updateUser(user_id: string, updated: object) {
    const [result] = await db.update(users).set(updated).where(eq(users.id, user_id)).returning();
    return result;
}