import { http } from "./api-client";

export type TaskTransition = { status: string; actorId?: string | null; note?: string; actualResult?: string; blockedReason?: string };
export const taskService = {
  list: () => http.get<Record<string, unknown>[]>("/api/tasks"),
  get: (id: string) => http.get<Record<string, unknown>>(`/api/tasks/${id}`),
  create: (input: Record<string, unknown>) => http.post<Record<string, unknown>>("/api/tasks", input),
  update: (id: string, input: Record<string, unknown>) => http.patch<Record<string, unknown>>(`/api/tasks/${id}`, input),
  remove: (id: string) => http.delete(`/api/tasks/${id}`),
  transition: (id: string, input: TaskTransition) => http.post<Record<string, unknown>>(`/api/tasks/${id}/transition`, input),
  checklist: { list: (id: string) => http.get<Record<string, unknown>[]>(`/api/tasks/${id}/checklist`), create: (id: string, input: { content: string; required?: boolean }) => http.post(`/api/tasks/${id}/checklist`, input), update: (id: string, input: { itemId: string; completed?: boolean; content?: string; required?: boolean }) => http.patch(`/api/tasks/${id}/checklist`, input) },
  assignees: { list: (id: string) => http.get<Record<string, unknown>[]>(`/api/tasks/${id}/assignees`), add: (id: string, input: { userId: string; role?: string }) => http.post(`/api/tasks/${id}/assignees`, input) },
};

export const taskQueryKeys = { all: ["tasks"] as const, detail: (id: string) => ["tasks", id] as const };
