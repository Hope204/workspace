import { NextRequest } from "next/server";
import { db } from "@/db";
import { taskAssignees, tasks } from "@/db/schema";
import { taskParentIsValid } from "@/lib/api/task-parent";
import { refreshPlanProgress } from "@/lib/api/plan-progress";
import { badRequest, created, ok, serverError } from "@/lib/api/response";
import { taskInputSchema } from "@/lib/api/schemas";
import { requireAuth, requireTaskCreator } from "@/lib/auth/request-auth";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try {
    const [taskRows, assignments] = await Promise.all([db.select().from(tasks), db.select({ taskId: taskAssignees.taskId, userId: taskAssignees.userId }).from(taskAssignees)]);
    const assigneesByTask = new Map<string, string[]>();
    for (const assignment of assignments) assigneesByTask.set(assignment.taskId, [...(assigneesByTask.get(assignment.taskId) ?? []), assignment.userId]);
    return ok(taskRows.map((task) => ({ ...task, collaboratorIds: assigneesByTask.get(task.id) ?? [] })));
  } catch (error) { return serverError(error); }
}

export async function POST(request: NextRequest) {
  const denied = requireTaskCreator(request); if (denied) return denied;
  try {
    const parsed = taskInputSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { assigneeIds = [], ...taskInput } = parsed.data;
    const assigneeId = taskInput.assigneeId ?? assigneeIds[0] ?? null;
    if (!await taskParentIsValid(taskInput.planId, taskInput.workspaceId)) return badRequest("Kế hoạch không thuộc Workspace đã chọn.");
    const [task] = await db.insert(tasks).values({ ...taskInput, assigneeId }).returning();
    const assignedUsers = [...new Set([task.ownerId, task.assigneeId, ...assigneeIds].filter((id): id is string => Boolean(id)))];
    if (assignedUsers.length) await db.insert(taskAssignees).values(assignedUsers.map((userId) => ({ taskId: task.id, userId, role: userId === task.assigneeId ? "Chính" : userId === task.ownerId ? "Giao việc" : "Phối hợp" }))).onConflictDoNothing();
    await refreshPlanProgress(task.planId);
    return created(task);
  } catch (error) { return serverError(error); }
}
