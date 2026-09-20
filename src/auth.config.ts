import type { NextAuthConfig } from "next-auth";

// Edge-safe base config: no adapter, no providers, no Node-only imports
// (mongoose/mongodb pull in "dns"/"net", which the Edge Runtime doesn't support).
// middleware.ts uses this directly; the full config in auth.ts extends it.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.theme = (token.theme as "light" | "dark" | "system") ?? "system";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
