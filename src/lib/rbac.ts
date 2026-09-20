import { auth } from "@/auth";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError("Not signed in");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new ForbiddenError("Admin access required");
  return user;
}
