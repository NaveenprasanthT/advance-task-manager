"use server";

import bcrypt from "bcryptjs";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel } from "@/models/User";

export interface SignupState {
  error?: string;
  success?: boolean;
}

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are all required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  await connectMongoose();

  const existing = await UserModel.findOne({ email });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await UserModel.create({
    name,
    email,
    passwordHash,
    role: "user",
    authProviders: ["credentials"],
  });

  return { success: true };
}
