import { StudyPlanModel } from "@/models/StudyPlan";

/** Shared ownership check for every entry-scoped route (`[id]/entries/[entryId]/**`). */
export async function verifyPlanOwnership(planId: string, ownerId: string): Promise<boolean> {
  const exists = await StudyPlanModel.exists({ _id: planId, owner: ownerId });
  return Boolean(exists);
}
