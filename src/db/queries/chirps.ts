// ============================================================
// DB query helpers for the chirps table (create / read / delete).
// ============================================================
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { chirps, NewChirp } from "../schema.js";

// Insert a new chirp row.
export async function createChirp(chirp: NewChirp) {
    const [result] = await db.insert(chirps).values(chirp).returning();
    return result;
}

// Fetch a single chirp by id, or a list filtered by authorId, or all chirps.
// sort controls createdAt ordering: "desc" for newest first, anything else (default) is ascending.
export async function getChirps(chirpID?: string, authorId?: string, sort?: string) {
    const order = sort === "desc" ? desc(chirps.createdAt) : asc(chirps.createdAt);

    if (chirpID) {
        const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpID));
        return result;
    } else if (authorId) {
        const result = await db.select().from(chirps).where(eq(chirps.userId, authorId)).orderBy(order);
        return result;
    }
    const result = await db.select().from(chirps).orderBy(order);
    return result;
}

// Delete a chirp, but only if it belongs to user_id.
// Returns -1 if the chirp doesn't exist, 0 if it exists but belongs to someone else, 1 on success.
export async function deleteChirp(chirpID: string, user_id: string) {
    const [find] = await db.select().from(chirps).where(eq(chirps.id, chirpID));
    const [result] = await db.delete(chirps).where(and(eq(chirps.id, chirpID), eq(chirps.userId, user_id))).returning();
    
    if (!find)
        return -1;
    else if (find && !result)
        return 0;
    else return 1;
}