import { config } from "dotenv";
config({ path: ".env.local" });

import { connectMongoose } from "../src/lib/mongoose";
import { TaskModel } from "../src/models/Task";
import { RecurringTaskLogModel } from "../src/models/RecurringTaskLog";
import { toDateOnly } from "../src/lib/recurrence";
import mongoose, { type AnyBulkWriteOperation } from "mongoose";

// One-time, idempotent migration: folds existing origin:"recurring" Task
// documents into RecurringTaskLog rows under the new model (see
// src/models/RecurringTaskLog.ts). Safe to re-run - every write is an
// upsert keyed on {recurringTaskId, date}, so a partial/failed run can
// simply be re-invoked. Does not modify or delete any Task document.
async function main() {
  await connectMongoose();

  const occurrences = await TaskModel.find({ origin: "recurring", recurringTaskId: { $exists: true } })
    .select("recurringTaskId owner occurrenceDate status actualCompletedAt updatedAt")
    .lean();

  const today = toDateOnly(new Date());
  const ops: AnyBulkWriteOperation[] = [];
  let migrated = 0;
  let skippedPending = 0;
  let skippedNoDate = 0;

  for (const occ of occurrences) {
    if (!occ.occurrenceDate || !occ.recurringTaskId) {
      skippedNoDate++;
      continue;
    }
    const date = toDateOnly(new Date(occ.occurrenceDate));

    let status: "done" | "missed" | null = null;
    let resolvedAt: Date = occ.updatedAt ?? new Date();

    if (occ.status === "Done") {
      status = "done";
      resolvedAt = occ.actualCompletedAt ?? occ.updatedAt ?? new Date();
    } else if (occ.status === "Aborted") {
      status = "missed";
      resolvedAt = occ.updatedAt ?? new Date();
    } else if (date.getTime() < today.getTime()) {
      // Unresolved (Todo/InProgress/OnHold/Suggested) and the day has
      // already passed - a missed day under the new auto-sweep rule.
      status = "missed";
      resolvedAt = new Date();
    } else {
      // Unresolved and today-or-future - correctly left unresolved (no
      // row) under the new model. The old Task doc is left untouched.
      skippedPending++;
      continue;
    }

    ops.push({
      updateOne: {
        filter: { recurringTaskId: occ.recurringTaskId, date },
        update: { $setOnInsert: { recurringTaskId: occ.recurringTaskId, owner: occ.owner, date, status, resolvedAt } },
        upsert: true,
      },
    });
    migrated++;
  }

  if (ops.length > 0) {
    const result = await RecurringTaskLogModel.bulkWrite(ops, { ordered: false });
    console.log(
      `Upserted ${result.upsertedCount} new log rows (${migrated - result.upsertedCount} already existed from a prior run).`,
    );
  }

  console.log(
    `Done. Scanned ${occurrences.length} recurring Task docs: ${migrated} migrated, ${skippedPending} left pending (today/future, unresolved), ${skippedNoDate} skipped (missing fields).`,
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
