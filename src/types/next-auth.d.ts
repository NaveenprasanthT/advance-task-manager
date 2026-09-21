import type { DefaultSession } from "next-auth";
import type { ThemePreference } from "@/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      theme: ThemePreference;
      puzzleAccess: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "user" | "admin";
    theme?: ThemePreference;
    puzzleAccess?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin";
    theme?: ThemePreference;
    puzzleAccess?: boolean;
  }
}
