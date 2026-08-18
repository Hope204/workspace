import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  activityLogs,
  approvals,
  attachments,
  checklistItems,
  comments,
  notifications,
  projects,
  riskIssues,
  subtasks,
  taskAssignees,
  tasks,
  workGroups,
  workspaceMembers,
  workspaces,
  plans,
} from "./schema";

config({ path: ".env.local" });
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
const db = drizzle({ client: neon(databaseUrl) });

async function clearBusinessData() {
  await db.delete(notifications);
  await db.delete(activityLogs);
  await db.delete(approvals);
  await db.delete(attachments);
  await db.delete(comments);
  await db.delete(checklistItems);
  await db.delete(subtasks);
  await db.delete(taskAssignees);
  await db.delete(tasks);
  await db.delete(riskIssues);
  await db.delete(workGroups);
  await db.delete(plans);
  await db.delete(projects);
  await db.delete(workspaceMembers);
  await db.delete(workspaces);
  console.log("Đã xóa dữ liệu nghiệp vụ; giữ nguyên tài khoản và phòng ban.");
}

clearBusinessData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
