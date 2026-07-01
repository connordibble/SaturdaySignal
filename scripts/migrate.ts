import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for pnpm db:migrate.");
}

async function main(databaseUrl: string) {
  const sql = postgres(databaseUrl, { max: 1 });
  const migrationsDir = join(process.cwd(), "drizzle");
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const migration = await readFile(join(migrationsDir, file), "utf8");
    await sql.unsafe(migration);
    console.log(`Applied ${file}`);
  }

  await sql.end();
}

main(connectionString).catch((error) => {
  console.error(error);
  process.exit(1);
});
