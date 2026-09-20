"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TaskDTO } from "@/types/task";
import type { TaskCategory, TaskStatus, EstimateUnit, SubtaskStatus } from "@/models/Task";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useTasksQuery(category: TaskCategory) {
  return useQuery({
    queryKey: ["tasks", category],
    queryFn: () => fetchJson<TaskDTO[]>(`/api/tasks?category=${category}`),
  });
}

export interface CreateTaskInput {
  category: TaskCategory;
  title: string;
  description?: string;
  estimateValue?: number;
  estimateUnit?: EstimateUnit;
  dueDate?: string;
  plannedStart?: string;
  plannedEnd?: string;
}

export function useCreateTask(category: TaskCategory) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      fetchJson<TaskDTO>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (task) => {
      queryClient.setQueryData<TaskDTO[]>(["tasks", category], (old) => [...(old ?? []), task]);
      toast.success("Task created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface UpdateTaskStatusInput {
  id: string;
  status: TaskStatus;
  boardOrder?: number;
  abortReason?: string;
}

export function useUpdateTaskStatus(category: TaskCategory) {
  const queryClient = useQueryClient();
  const queryKey = ["tasks", category];

  return useMutation({
    mutationFn: (input: UpdateTaskStatusInput) =>
      fetchJson<TaskDTO>(`/api/tasks/${input.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: input.status, boardOrder: input.boardOrder, abortReason: input.abortReason }),
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TaskDTO[]>(queryKey);
      queryClient.setQueryData<TaskDTO[]>(queryKey, (old) =>
        (old ?? []).map((t) =>
          t.id === input.id
            ? { ...t, status: input.status, boardOrder: input.boardOrder ?? t.boardOrder }
            : t,
        ),
      );
      return { previous };
    },
    onError: (error: Error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(error.message || "Couldn't move task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateTask(category: TaskCategory) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<CreateTaskInput>) =>
      fetchJson<TaskDTO>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (task) => {
      queryClient.setQueryData<TaskDTO[]>(["tasks", category], (old) =>
        (old ?? []).map((t) => (t.id === task.id ? task : t)),
      );
      toast.success("Task updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTask(category: TaskCategory) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ success: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: (_res, id) => {
      queryClient.setQueryData<TaskDTO[]>(["tasks", category], (old) => (old ?? []).filter((t) => t.id !== id));
      toast.success("Task deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddSubtask(category: TaskCategory) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      fetchJson<TaskDTO>(`/api/tasks/${taskId}/subtasks`, { method: "POST", body: JSON.stringify({ title }) }),
    onSuccess: (task) => {
      queryClient.setQueryData<TaskDTO[]>(["tasks", category], (old) =>
        (old ?? []).map((t) => (t.id === task.id ? task : t)),
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateSubtask(category: TaskCategory) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      subtaskId,
      status,
    }: {
      taskId: string;
      subtaskId: string;
      status: SubtaskStatus;
    }) =>
      fetchJson<TaskDTO>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ taskId, subtaskId, status }) => {
      const queryKey = ["tasks", category];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TaskDTO[]>(queryKey);
      queryClient.setQueryData<TaskDTO[]>(queryKey, (old) =>
        (old ?? []).map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, status } : s)) }
            : t,
        ),
      );
      return { previous };
    },
    onError: (error: Error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(["tasks", category], context.previous);
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", category] });
    },
  });
}

export function useDeleteSubtask(category: TaskCategory) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId }: { taskId: string; subtaskId: string }) =>
      fetchJson<TaskDTO>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { method: "DELETE" }),
    onSuccess: (task) => {
      queryClient.setQueryData<TaskDTO[]>(["tasks", category], (old) =>
        (old ?? []).map((t) => (t.id === task.id ? task : t)),
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
