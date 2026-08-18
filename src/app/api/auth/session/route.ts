import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth/request-auth";
import { normalizeRole } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
  const [user] = await db.select({ id: users.id, username: users.username, name: users.name, role: users.role }).from(users).where(eq(users.id, session.id));
  if (!user) return NextResponse.json({ error: "Tài khoản không còn tồn tại." }, { status: 401 });
  return NextResponse.json({ data: { ...user, role: normalizeRole(user.role) } });
}
