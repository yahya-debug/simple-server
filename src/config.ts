// ============================================================
// App-wide config, loaded from .env at startup.
// ============================================================
process.loadEnvFile();
export type APIConfig = {
    fileserverhits: number;
    DB_URL: string;
    platform: string;
    secret: string;
    apiKey: string;
}

// Singleton config instance used throughout the app (index.ts, auth.ts, middles.ts).
export const config: APIConfig = {
    fileserverhits: 0,
    DB_URL: process.env.DB_URL || "",
    platform: "dev",
    secret: process.env.SECRET || "",
    apiKey: process.env.POLKA_KEY || "",
}