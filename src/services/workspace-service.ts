import { http } from "./api-client";

export type ApiWorkspace = { id: string; code: string; name: string; description: string; type: string; ownerId: string | null; status: "Hoạt động" | "Lưu trữ"; deadline: string | null; createdAt: string; updatedAt: string };
export type WorkspaceInput = Pick<ApiWorkspace, "code" | "name" | "description" | "type"> & Partial<Pick<ApiWorkspace, "ownerId" | "status" | "deadline">>;
export type WorkspaceMemberInput = { userId: string; role: string };

export const workspaceService = {
  list: () => http.get<ApiWorkspace[]>("/api/workspaces"),
  get: (id: string) => http.get<ApiWorkspace>(`/api/workspaces/${id}`),
  detail: (id: string) => http.get<Record<string, unknown>>(`/api/workspaces/${id}/detail`),
  create: (input: WorkspaceInput) => http.post<ApiWorkspace>("/api/workspaces", input),
  update: (id: string, input: Partial<WorkspaceInput>) => http.patch<ApiWorkspace>(`/api/workspaces/${id}`, input),
  remove: (id: string) => http.delete(`/api/workspaces?id=${id}`),
  members: (id: string) => http.get<Array<{ id: string; userId: string; name: string; role: string }>>(`/api/workspaces/${id}/members`),
  addMember: (id: string, input: WorkspaceMemberInput) => http.post(`/api/workspaces/${id}/members`, input),
  removeMember: (id: string, userId: string) => http.delete(`/api/workspaces/${id}/members?userId=${userId}`),
};

export const workspaceQueryKeys = {
  all: ["workspaces"] as const,
  detail: (id: string) => ["workspaces", id, "detail"] as const,
};
