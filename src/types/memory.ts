import type { TaskPriority } from "@/models/Task";

export interface MemoryFileDTO {
  id: string;
  url: string;
  resourceType: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface MemoryDTO {
  id: string;
  name: string;
  description: string | null;
  rememberDate: string | null;
  category: string | null;
  priority: TaskPriority;
  files: MemoryFileDTO[];
  createdAt: string;
  updatedAt: string;
}
