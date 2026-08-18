import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { approvals, plans, users, workspaces } from "./schema";

config({ path: ".env.local" });
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
const db = drizzle({ client: neon(databaseUrl) });

const keepUserIds = [
  "20000000-0000-4000-8000-000000000001", // Lê Võ Mai Phương
  "20000000-0000-4000-8000-000000000003", // Võ Thị Hương Giang
  "20000000-0000-4000-8000-000000000004", // Bùi Thị Hồng Đào
  "20000000-0000-4000-8000-000000000005", // Trần Thanh Hiếu
];
const managerId = keepUserIds[0];

async function keepFourUsers() {
  await db.update(workspaces).set({ ownerId: managerId, updatedAt: new Date() }).where(eq(workspaces.ownerId, "20000000-0000-4000-8000-000000000006"));
  await db.update(plans).set({ approverId: managerId, updatedAt: new Date() }).where(eq(plans.approverId, "20000000-0000-4000-8000-000000000002"));
  await db.update(approvals).set({ approverId: managerId, updatedAt: new Date() }).where(eq(approvals.approverId, "20000000-0000-4000-8000-000000000002"));
  await db.update(users).set({ role: "OM", updatedAt: new Date() }).where(eq(users.id, managerId));
  await db.update(users).set({ role: "Manager", updatedAt: new Date() }).where(eq(users.id, keepUserIds[3]));
  await db.update(users).set({ role: "User", updatedAt: new Date() }).where(inArray(users.id, keepUserIds.slice(1, 3)));
  await db.delete(users).where(inArray(users.id, [
    "20000000-0000-4000-8000-000000000002",
    "20000000-0000-4000-8000-000000000006",
    "20000000-0000-4000-8000-000000000007",
    "20000000-0000-4000-8000-000000000008",
  ]));
  console.log("Đã giữ 4 tài khoản: 1 OM, 1 Manager, 2 User; đồng thời xoá 4 tài khoản còn lại.");
}

keepFourUsers().catch((error) => { console.error(error); process.exitCode = 1; });
