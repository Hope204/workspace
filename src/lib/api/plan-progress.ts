import { eq } from "drizzle-orm";
import { db } from "@/db";
import { plans, tasks } from "@/db/schema";

/** Recalculates the plan progress from its linked tasks after any task mutation. */
export async function refreshPlanProgress(planId: string) {
  const rows = await db.select({ progress: tasks.progress }).from(tasks).where(eq(tasks.planId, planId));
  const progress = rows.length === 0 ? 0 : Math.round(rows.reduce((sum, task) => sum + task.progress, 0) / rows.length);
  await db.update(plans).set({ progress, updatedAt: new Date() }).where(eq(plans.id, planId));
  return progress;
}
