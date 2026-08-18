import { eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { badRequest, noContent, notFound, ok, serverError } from "@/lib/api/response";
import { planPatchSchema } from "@/lib/api/schemas";
import { requireManager } from "@/lib/auth/request-auth";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan ? ok(plan) : notFound("Kế hoạch");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const denied = requireManager(request); if (denied) return denied;
  try {
    const parsed = planPatchSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { id } = await params;
    const [existing] = await db.select().from(plans).where(eq(plans.id, id));
    if (!existing) return notFound("Kế hoạch");
    const startDate = parsed.data.startDate ?? existing.startDate;
    const deadline = parsed.data.deadline ?? existing.deadline;
    if (startDate && deadline && deadline < startDate) return badRequest("Deadline không được nhỏ hơn ngày bắt đầu.");
    const [plan] = await db
      .update(plans)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return plan ? ok(plan) : notFound("Kế hoạch");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = requireManager(request); if (denied) return denied;
  try {
    const { id } = await params;
    const [deleted] = await db.delete(plans).where(eq(plans.id, id)).returning({ id: plans.id });
    return deleted ? noContent() : notFound("Kế hoạch");
  } catch (error) {
    return serverError(error);
  }
}
