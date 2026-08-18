import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ data: { loggedOut: true } });
  response.cookies.set("workspace_user", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
