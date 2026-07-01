import postgres from "postgres";
import { config } from "../config.js";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from './schema.js'
import type { MigrationConfig } from "drizzle-orm/migrator";

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db",
};
import { migrate } from "drizzle-orm/postgres-js/migrator";
const conn = postgres(config.DB_URL);
export const db = drizzle(conn, { schema: schema })

// auto migrate
const migrationClient = postgres(config.DB_URL, { max: 1 });
await migrate(drizzle(migrationClient), migrationConfig);
