import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, workspaceMembers } from "@/db/schema";
import { badRequest, created, noContent, ok, serverError } from "@/lib/api/response";
import { requireManager } from "@/lib/auth/request-auth";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };
const input = z.object({ userId: z.string().uuid(), role: z.string().trim().min(2).max(50).default("Thành viên") });

export async function GET(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const members = await db
      .select({ id: workspaceMembers.id, userId: users.id, code: users.code, name: users.name, email: users.email, role: workspaceMembers.role })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, id));
    return ok(members);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const denied = requireManager(request); if (denied) return denied;
  try {
    const parsed = input.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { id } = await params;
    const [member] = await db.insert(workspaceMembers).values({ workspaceId: id, ...parsed.data }).returning();
    return created(member);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = requireManager(request); if (denied) return denied;
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return badRequest("Thiếu userId.");
    const { id } = await params;
    await db.delete(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, userId)));
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}
