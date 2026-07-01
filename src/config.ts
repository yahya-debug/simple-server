process.loadEnvFile();
export type APIConfig = {
    fileserverhits: number;
    DB_URL: string;
}

export const config: APIConfig = {
    fileserverhits: 0,
    DB_URL: process.env.DB_URL || "",
}