import type { StudyPlanFrequency, StudyPlanStatus } from "@/models/StudyPlan";
import type { StudyPlanEntryStatus } from "@/models/StudyPlanEntry";

export interface StudyPlanSourceFileDTO {
  url: string;
  fileName: string;
}

export interface StudyPlanDTO {
  id: string;
  title: string;
  frequency: StudyPlanFrequency;
  startDate: string;
  endDate: string | null;
  status: StudyPlanStatus;
  sourceFile: StudyPlanSourceFileDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlanSummaryDTO extends StudyPlanDTO {
  totalEntries: number;
  completedEntries: number;
  percentComplete: number | null;
  nextPendingEntry: { index: number; date: string; label: string | null } | null;
  currentStreak: number;
  bestStreak: number;
  paceStatus: "onTrack" | "behind";
  behindCount: number;
}

export interface StudyPlanTopicDTO {
  title: string;
  description: string | null;
}

export interface StudyPlanEntryFileDTO {
  id: string;
  url: string;
  resourceType: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface StudyPlanEntryLinkDTO {
  id: string;
  url: string;
  label: string | null;
  createdAt: string;
}

export interface StudyPlanEntryDTO {
  id: string;
  studyPlanId: string;
  index: number;
  date: string;
  label: string | null;
  topics: StudyPlanTopicDTO[];
  status: StudyPlanEntryStatus;
  reason: string | null;
  resolvedAt: string | null;
  notes: string | null;
  files: StudyPlanEntryFileDTO[];
  links: StudyPlanEntryLinkDTO[];
  createdAt: string;
  updatedAt: string;
}
