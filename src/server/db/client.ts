import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function createDbClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create a database client.");
  }

  const client = postgres(connectionString, { max: 1, connect_timeout: 5 });

  return {
    db: drizzle(client, { schema }),
    client,
  };
}
