import { NextResponse } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/rbac";

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(error);
  return NextResponse.json({ error: message }, { status: 400 });
}
