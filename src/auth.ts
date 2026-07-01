// ============================================================
// Auth helpers, grouped by topic:
//   - Password hashing         (hashPassword, checkPasswordHash)
//   - Access JWTs               (makeJWT, validateJWT)
//   - Refresh tokens             (makeRefreshToken, getRefreshToken, revokeToken, saveTok)
//   - Request header parsing    (getBearerToken, getAPIKey)
// ============================================================
import argon2 from 'argon2'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { UnauthorizedErr } from './errors.js';
import { Request } from 'express';
import { randomBytes } from 'node:crypto';
import { db } from './db/db.js';
import { refresh_tokens } from './db/schema.js';
import { eq } from 'drizzle-orm';

type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;


// ---- Password hashing ----
export async function hashPassword(password: string): Promise<string> {
    try {
        const hashed = await argon2.hash(password);
        return hashed;
    } catch (err) {
        throw new Error("Error hashing it");
    }
}

// ---- Password hashing ----
export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    try {
        const hash_provided = await argon2.verify(hash, password);
        if (hash_provided)
            return true;
        else return false;
    } catch (err) {
        throw new Error("Error hashing");
    }
}


// ---- Access JWTs ----
// Signs a short-lived access token for userId.
export function makeJWT(userId: string, expiresIn: number, secret: string): string {
    const iat = Math.floor(Date.now() / 1000);
    const payload: Payload = {
        iss: "chirpy",
        sub: userId,
        iat,
        exp: iat + expiresIn,
    };
    return jwt.sign(payload, secret);
}

// ---- Access JWTs ----
// Verifies and decodes an access token, returning the userId (sub claim).
export function validateJWT(tokenString: string, secret: string): string {
    let verified: Payload;
    try {
        verified = jwt.verify(tokenString, secret) as Payload;
    } catch (err) {
        throw new UnauthorizedErr("Not authorized");
    }
    if (verified.sub == undefined)
        throw new UnauthorizedErr("Not authorized");
    return verified.sub;
}

// ---- Refresh tokens ----
// Generates a random opaque refresh token string.
export function makeRefreshToken() {
    return randomBytes(32).toString('hex');
}
// ---- Refresh tokens ----
// Looks up a refresh token row by its token string.
export async function getRefreshToken(token: string) {
    const [result] = await db.select().from(refresh_tokens).where(eq(refresh_tokens.token, token));
    return result;
}

// ---- Refresh tokens ----
// Marks a refresh token as revoked so it can no longer be used.
export async function revokeToken(token: string) {
    await db.update(refresh_tokens).set({ revoked_at: new Date() }).where(eq(refresh_tokens.token, token));
}

// ---- Refresh tokens ----
// Persists a newly issued refresh token for a user.
export async function saveTok(token: string, user_id: string) {
    await db.insert(refresh_tokens).values({ user_id: user_id, token: token });
}

// ---- Request header parsing ----
// Extracts the token from an "Authorization: Bearer <token>" header.
export function getBearerToken(req: Request): string {
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer '))
        throw new UnauthorizedErr("No tokens")

    return authHeader.split(' ')[1];
}

// ---- Request header parsing ----
// Extracts the key from an "Authorization: ApiKey <key>" header (used by the Polka webhook).
export function getAPIKey(req: Request): string {
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('ApiKey '))
        throw new UnauthorizedErr("No keys")

    return authHeader.split(' ')[1];
}
