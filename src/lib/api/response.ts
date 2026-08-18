import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function ok<T>(data: T) {
  return NextResponse.json({ data });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function notFound(resource = "Bản ghi") {
  return NextResponse.json({ error: `${resource} không tồn tại.` }, { status: 404 });
}

export function badRequest(error: ZodError | string) {
  return NextResponse.json(
    { error: error instanceof ZodError ? error.flatten() : error },
    { status: 400 },
  );
}

export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json({ error: "Không thể xử lý yêu cầu. Vui lòng thử lại." }, { status: 500 });
}
