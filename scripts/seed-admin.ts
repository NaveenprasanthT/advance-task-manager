import { config } from "dotenv";
config({ path: ".env.local" });

import { connectMongoose } from "../src/lib/mongoose";
import { UserModel } from "../src/models/User";
import mongoose from "mongoose";

async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) {
    console.error("Usage: tsx scripts/seed-admin.ts <email>");
    process.exit(1);
  }

  await connectMongoose();

  const user = await UserModel.findOne({ email });
  if (!user) {
    console.error(`No user found with email ${email}. They must sign up first.`);
    process.exit(1);
  }

  user.role = "admin";
  await user.save();
  console.log(`Promoted ${email} to admin.`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
