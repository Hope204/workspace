import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/request-auth";
import { normalizeRole } from "@/lib/auth/roles";

const input = z.object({ username: z.string().trim().min(3), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Thông tin đăng nhập không hợp lệ." }, { status: 400 });
  const [user] = await db.select().from(users).where(eq(users.username, parsed.data.username));
  if (!user?.passwordHash || !verifyPassword(parsed.data.password, user.passwordHash)) return NextResponse.json({ error: "Tài khoản hoặc mật khẩu không đúng." }, { status: 401 });
  const role = normalizeRole(user.role);
  const response = NextResponse.json({ data: { id: user.id, code: user.code, username: user.username, name: user.name, role } });
  response.cookies.set("workspace_user", createSessionToken({ id: user.id, role }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
