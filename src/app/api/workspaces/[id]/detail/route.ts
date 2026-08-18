import { eq } from "drizzle-orm";
import { db } from "@/db";
import { plans, tasks, users, workspaceMembers, workspaces } from "@/db/schema";
import { notFound, ok, serverError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    if (!workspace) return notFound("Workspace");
    const [members, relatedPlans, relatedTasks] = await Promise.all([
      db.select({ id: users.id, code: users.code, name: users.name, role: workspaceMembers.role, systemRole: users.role }).from(workspaceMembers).innerJoin(users, eq(workspaceMembers.userId, users.id)).where(eq(workspaceMembers.workspaceId, id)),
      db.select().from(plans).where(eq(plans.workspaceId, id)),
      db.select().from(tasks).where(eq(tasks.workspaceId, id)),
    ]);
    const completed = relatedTasks.filter((task) => task.status === "Hoàn thành" || task.status === "Đóng").length;
    const overdue = relatedTasks.filter((task) => task.deadline && task.deadline < new Date() && !["Hoàn thành", "Đóng", "Hủy"].includes(task.status)).length;
    return ok({ workspace, members, plans: relatedPlans, tasks: relatedTasks, summary: { progress: relatedTasks.length ? Math.round(relatedTasks.reduce((sum, task) => sum + task.progress, 0) / relatedTasks.length) : 0, completedTasks: completed, overdueTasks: overdue } });
  } catch (error) { return serverError(error); }
}
