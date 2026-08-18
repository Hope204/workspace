import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { taskAssignees, tasks } from "@/db/schema";
import { canCreateTasks, normalizeRole } from "@/lib/auth/roles";

export type Session = { id: string; role: string; expiresAt: number };

const SESSION_MAX_AGE = 60 * 60 * 8;

function signingKey() {
  const key = process.env.SESSION_SECRET || process.env.DATABASE_URL;
  if (!key) throw new Error("SESSION_SECRET or DATABASE_URL must be configured");
  return key;
}

function sign(value: string) {
  return createHmac("sha256", signingKey()).update(value).digest("base64url");
}

export function createSessionToken(user: { id: string; role: string }) {
  const payload = Buffer.from(JSON.stringify({ ...user, expiresAt: Date.now() + SESSION_MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function getSession(request: NextRequest): Session | null {
  const raw = request.cookies.get("workspace_user")?.value;
  if (!raw) return null;
  try {
    const [payload, signature] = raw.split(".");
    if (!payload || !signature) return null;
    const expected = Buffer.from(sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    return parsed.id && parsed.role && parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export function requireAuth(request: NextRequest) {
  const session = getSession(request);
  return session ? { session } : { response: NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
}

export function requireManager(request: NextRequest) {
  return requireOM(request);
}

export function requireOM(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (normalizeRole(session.role) !== "OM") return NextResponse.json({ error: "Chỉ OM được phép thực hiện thao tác này." }, { status: 403 });
  return null;
}

export function requireTaskCreator(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!canCreateTasks(session.role)) return NextResponse.json({ error: "Chỉ OM hoặc Manager được phép tạo và quản lý task." }, { status: 403 });
  return null;
}

export async function requireTaskAccess(request: NextRequest, taskId: string, write = false) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (canCreateTasks(session.role)) return null;
  const [task] = await db.select({ ownerId: tasks.ownerId, assigneeId: tasks.assigneeId }).from(tasks).where(eq(tasks.id, taskId));
  if (!task) return NextResponse.json({ error: "Công việc không tồn tại." }, { status: 404 });
  if (task.ownerId === session.id || task.assigneeId === session.id) return null;
  const [assignment] = await db.select({ id: taskAssignees.id }).from(taskAssignees).where(and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, session.id)));
  if (!assignment) return NextResponse.json({ error: "Bạn chỉ được phép xem và cập nhật công việc thuộc phân công của bạn." }, { status: 403 });
  return null;
}

export async function requireTaskProgressAccess(request: NextRequest, taskId: string) {
  return requireTaskAccess(request, taskId, false);
}
