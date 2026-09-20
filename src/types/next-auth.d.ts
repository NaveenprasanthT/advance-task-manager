import type { DefaultSession } from "next-auth";
import type { ThemePreference } from "@/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      theme: ThemePreference;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "user" | "admin";
    theme?: ThemePreference;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin";
    theme?: ThemePreference;
  }
}
