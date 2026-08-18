import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not configured");

const sql = neon(url);

async function run() {
  console.log("Applying column assignee_id and enum Cần hỗ trợ to Neon Postgres...");
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id);`;
  try {
    await sql`ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'Cần hỗ trợ';`;
  } catch (err) {
    console.log("Enum warning:", err instanceof Error ? err.message : err);
  }
  console.log("Migration finished successfully!");
}

run().catch(console.error);
