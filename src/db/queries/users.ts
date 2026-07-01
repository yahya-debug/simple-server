import { db } from "../db.js";
import { NewUser, users } from "../schema.js";

export async function createUser(user: NewUser) {
    const [result] = await db.insert(users).values(user).returning();
    return result;
}