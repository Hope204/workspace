import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { taskAssignees, tasks } from "@/db/schema";
import { taskParentIsValid } from "@/lib/api/task-parent";
import { refreshPlanProgress } from "@/lib/api/plan-progress";
import { badRequest, noContent, notFound, ok, serverError } from "@/lib/api/response";
import { taskPatchSchema, taskProgressPatchSchema } from "@/lib/api/schemas";
import { getSession, requireTaskCreator, requireTaskAccess, requireTaskProgressAccess } from "@/lib/auth/request-auth";
import { normalizeRole } from "@/lib/auth/roles";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try { const { id } = await params; const denied = await requireTaskAccess(request, id); if (denied) return denied; const [task] = await db.select().from(tasks).where(eq(tasks.id, id)); return task ? ok(task) : notFound("Công việc"); } catch (error) { return serverError(error); }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const session = getSession(request); if (!session) return badRequest("Phiên đăng nhập không hợp lệ.");
    const denied = await requireTaskAccess(request, id);
    if (denied) return denied;
    const body = await request.json();
    const parsed = taskPatchSchema.safeParse(body); if (!parsed.success) return badRequest(parsed.error);
    const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)); if (!existing) return notFound("Công việc");
    const { assigneeIds, ...taskPatch } = parsed.data;
    const startDate = taskPatch.startDate ?? existing.startDate;
    const deadline = taskPatch.deadline ?? existing.deadline;
    if (startDate && deadline && deadline < startDate) return badRequest("Deadline không được nhỏ hơn ngày bắt đầu.");
    const planId = taskPatch.planId ?? existing.planId;
    const workspaceId = taskPatch.workspaceId ?? existing.workspaceId;
    if (!await taskParentIsValid(planId, workspaceId)) return badRequest("Kế hoạch không thuộc Workspace đã chọn.");
    const [task] = await db.update(tasks).set({ ...taskPatch, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    if (!task) return notFound("Công việc");
    if (assigneeIds) {
      const assignedUsers = [...new Set([task.ownerId, ...assigneeIds].filter((userId): userId is string => Boolean(userId)))];
      await db.delete(taskAssignees).where(eq(taskAssignees.taskId, id));
      if (assignedUsers.length) await db.insert(taskAssignees).values(assignedUsers.map((userId) => ({ taskId: id, userId, role: userId === task.ownerId ? "Chịu trách nhiệm" : "Phối hợp" }))).onConflictDoNothing();
    }
    await refreshPlanProgress(existing.planId); if (task.planId !== existing.planId) await refreshPlanProgress(task.planId);
    return ok(task);
  } catch (error) { return serverError(error); }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = requireTaskCreator(request); if (denied) return denied;
  try { const { id } = await params; const [task] = await db.delete(tasks).where(eq(tasks.id, id)).returning(); if (!task) return notFound("Công việc"); await refreshPlanProgress(task.planId); return noContent(); } catch (error) { return serverError(error); }
}
