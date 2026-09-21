import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb-client";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        await connectMongoose();
        const user = await UserModel.findOne({ email: email.toLowerCase() }).select("+passwordHash");
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as "user" | "admin",
          theme: user.themePreference as "light" | "dark" | "system",
          puzzleAccess: user.puzzleAccess ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role ?? token.role ?? "user";
        token.theme = user.theme ?? token.theme ?? "system";
        token.puzzleAccess = user.puzzleAccess ?? token.puzzleAccess ?? false;
      }

      if (trigger === "update") {
        if (session?.name) token.name = session.name;
        if (session?.theme) token.theme = session.theme;
      }

      if (trigger === "signIn" && token.email) {
        await connectMongoose();
        const dbUser = await UserModel.findOne({ email: token.email });

        if (dbUser && token.email === process.env.ADMIN_EMAIL && dbUser.role !== "admin") {
          const adminExists = await UserModel.exists({ role: "admin" });
          if (!adminExists) {
            dbUser.role = "admin";
            await dbUser.save();
          }
        }

        // Read fresh from the DB regardless of provider, since OAuth sign-ins
        // don't reliably carry our custom fields on the `user` param above.
        if (dbUser) {
          token.role = dbUser.role as "user" | "admin";
          token.theme = (dbUser.themePreference as "light" | "dark" | "system") ?? "system";
          token.puzzleAccess = dbUser.puzzleAccess ?? false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.theme = (token.theme as "light" | "dark" | "system") ?? "system";
        session.user.puzzleAccess = Boolean(token.puzzleAccess);
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectMongoose();
        await UserModel.updateOne(
          { email: user.email!.toLowerCase() },
          { $addToSet: { authProviders: "google" } },
        );
      }
      return true;
    },
  },
});
