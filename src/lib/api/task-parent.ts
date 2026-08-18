import { eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";

/** Ensures a task cannot be attached to a plan from another workspace. */
export async function taskParentIsValid(planId: string, workspaceId: string) {
  const [plan] = await db.select({ workspaceId: plans.workspaceId }).from(plans).where(eq(plans.id, planId));
  return plan?.workspaceId === workspaceId;
}
