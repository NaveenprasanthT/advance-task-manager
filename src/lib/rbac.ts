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

// Puzzle game access: admins always have it; other users need it granted
// explicitly via the admin users page. Checked here (server-side) in addition
// to hiding the launcher client-side - the session flag alone is not enough
// enforcement since it's just UI state.
export async function requirePuzzleAccess() {
  const user = await requireUser();
  if (user.role !== "admin" && !user.puzzleAccess) {
    throw new ForbiddenError("Puzzle game access has not been granted for this account");
  }
  return user;
}
