import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { activityLogs, approvals, checklistItems, tasks } from "@/db/schema";
import { refreshPlanProgress } from "@/lib/api/plan-progress";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";
import { getSession, requireTaskAccess } from "@/lib/auth/request-auth";

const input = z.object({
  status: z.enum(["Chưa thực hiện", "Đang thực hiện", "Cần hỗ trợ", "Chờ phối hợp", "Chờ phản hồi", "Chờ duyệt", "Bị chặn", "Hoàn thành", "Làm lại", "Đóng", "Hủy"]),
  note: z.string().trim().max(2000).optional(), actualResult: z.string().trim().max(5000).optional(), blockedReason: z.string().trim().max(2000).optional(),
});
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const denied = await requireTaskAccess(request, id, true); if (denied) return denied;
    const session = getSession(request); if (!session) return badRequest("Phiên đăng nhập không hợp lệ.");
    const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error);
    const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)); if (!existing) return notFound("Công việc");
    if (parsed.data.status === "Bị chặn" && !parsed.data.blockedReason) return badRequest("Cần nhập nguyên nhân bị chặn.");
    if (parsed.data.status === "Hoàn thành") {
      const requiredItems = await db.select({ completed: checklistItems.completed }).from(checklistItems).where(and(eq(checklistItems.taskId, id), eq(checklistItems.required, true)));
      if (requiredItems.some((item) => !item.completed)) return badRequest("Cần hoàn tất checklist bắt buộc trước khi hoàn thành công việc.");
      if (!(parsed.data.actualResult ?? existing.actualResult)?.trim()) return badRequest("Cần nhập kết quả thực tế trước khi hoàn thành công việc.");
    }
    const isDone = parsed.data.status === "Hoàn thành" || parsed.data.status === "Đóng";
    const [task] = await db.update(tasks).set({ status: parsed.data.status, progress: isDone ? 100 : existing.progress, actualResult: parsed.data.actualResult ?? existing.actualResult, blockedReason: parsed.data.blockedReason ?? existing.blockedReason, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    if (!task) return notFound("Công việc");
    await db.insert(activityLogs).values({ entityType: "task", entityId: id, actorId: session.id, action: `Chuyển trạng thái: ${parsed.data.status}`, description: parsed.data.note ?? null, metadata: { previousStatus: existing.status, nextStatus: parsed.data.status } });
    if (["Chờ duyệt", "Hoàn thành", "Làm lại"].includes(parsed.data.status)) await db.insert(approvals).values({ entityType: "task", entityId: id, action: parsed.data.status, approverId: session.id, note: parsed.data.note ?? null, status: parsed.data.status });
    await refreshPlanProgress(task.planId);
    return ok(task);
  } catch (error) { return serverError(error); }
}
