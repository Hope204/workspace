import { db } from "@/db";
import { plans, tasks, workspaces } from "@/db/schema";
import { ok, serverError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/request-auth";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try {
    const [allPlans, allTasks, allWorkspaces] = await Promise.all([db.select().from(plans), db.select().from(tasks), db.select().from(workspaces)]);
    const completed = allTasks.filter((task) => task.status === "Hoàn thành" || task.status === "Đóng").length;
    const overdue = allTasks.filter((task) => task.deadline && task.deadline < new Date() && task.status !== "Hoàn thành" && task.status !== "Đóng" && task.status !== "Hủy").length;
    return ok({
      totals: {
        workspaces: allWorkspaces.length,
        plansInProgress: allPlans.filter((plan) => plan.status === "Đang thực hiện").length,
        tasks: allTasks.length,
        completedTasks: completed,
        overdueTasks: overdue,
        pendingApproval: allTasks.filter((task) => task.status === "Chờ duyệt").length,
        blockedTasks: allTasks.filter((task) => task.status === "Bị chặn").length,
      },
      planStatus: allPlans.reduce<Record<string, number>>((result, plan) => { result[plan.status] = (result[plan.status] ?? 0) + 1; return result; }, {}),
    });
  } catch (error) {
    return serverError(error);
  }
}
