import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { activityLogs, approvals, plans, tasks } from "@/db/schema";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";
import { requireManager } from "@/lib/auth/request-auth";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/request-auth";

const input = z.object({
  status: z.enum(["Nháp", "Chờ duyệt", "Đã duyệt", "Đang thực hiện", "Tạm dừng", "Chờ nghiệm thu", "Hoàn thành", "Đóng", "Từ chối", "Hủy"]),
  actorId: z.string().uuid().nullable().optional(),
  note: z.string().trim().max(2000).optional(),
});
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const denied = requireManager(request); if (denied) return denied;
  try {
    const parsed = input.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { id } = await params;
    const session = getSession(request); if (!session) return badRequest("Phiên đăng nhập không hợp lệ.");
    const [existing] = await db.select().from(plans).where(eq(plans.id, id));
    if (!existing) return notFound("Kế hoạch");

    if (parsed.data.status === "Đóng") {
      const planTasks = await db.select({ status: tasks.status }).from(tasks).where(eq(tasks.planId, id));
      const hasUnfinishedTask = planTasks.some((task) => task.status !== "Hoàn thành" && task.status !== "Đóng" && task.status !== "Hủy");
      if (hasUnfinishedTask) return badRequest("Chỉ có thể đóng kế hoạch sau khi các công việc đã hoàn tất.");
    }

    const [plan] = await db.update(plans).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(plans.id, id)).returning();
    if (!plan) return notFound("Kế hoạch");

    await db.insert(activityLogs).values({
      entityType: "plan",
      entityId: id,
      actorId: session.id,
      action: `Chuyển trạng thái: ${parsed.data.status}`,
      description: parsed.data.note ?? null,
      metadata: { previousStatus: existing.status, nextStatus: parsed.data.status },
    });
    if (["Chờ duyệt", "Đã duyệt", "Từ chối", "Chờ nghiệm thu", "Hoàn thành"].includes(parsed.data.status)) {
      await db.insert(approvals).values({
        entityType: "plan",
        entityId: id,
        action: parsed.data.status,
        approverId: session.id,
        note: parsed.data.note ?? null,
        status: parsed.data.status,
      });
    }
    return ok(plan);
  } catch (error) {
    return serverError(error);
  }
}
