import { http } from "./api-client";

export type PlanTransition = { status: string; actorId?: string | null; note?: string };
export const planService = {
  list: () => http.get<Record<string, unknown>[]>("/api/plans"),
  get: (id: string) => http.get<Record<string, unknown>>(`/api/plans/${id}`),
  create: (input: Record<string, unknown>) => http.post<Record<string, unknown>>("/api/plans", input),
  update: (id: string, input: Record<string, unknown>) => http.patch<Record<string, unknown>>(`/api/plans/${id}`, input),
  remove: (id: string) => http.delete(`/api/plans/${id}`),
  transition: (id: string, input: PlanTransition) => http.post<Record<string, unknown>>(`/api/plans/${id}/transition`, input),
};

export const planQueryKeys = { all: ["plans"] as const, detail: (id: string) => ["plans", id] as const };
