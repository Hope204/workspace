import { create } from "zustand";
import { http } from "@/services/api-client";
import type { ActivityLog, Approval, Plan, Task, Workspace } from "@/types/domain";

type WorkspaceInput = Pick<Workspace, "name" | "description" | "type"> & Partial<Pick<Workspace, "departmentId" | "departmentIds" | "ownerId" | "memberIds">>;
type PlanInput = Pick<Plan, "name" | "workspaceId" | "startDate" | "deadline" | "priority">;
type TaskInput = Pick<Task, "name" | "planId" | "workspaceId" | "ownerId" | "deadline" | "priority"> & Partial<Pick<Task, "assigneeId" | "note" | "attachmentNames" | "checklistItems" | "collaboratorIds">>;
type Row = Record<string, unknown>;

interface WorkspaceStore {
  workspaces: Workspace[]; plans: Plan[]; tasks: Task[]; approvals: Approval[]; activities: ActivityLog[];
  hydrate: () => Promise<void>;
  createWorkspace: (input: WorkspaceInput) => Promise<void>; updateWorkspace: (id: string, input: WorkspaceInput) => Promise<void>; deleteWorkspace: (id: string) => Promise<void>;
  createPlan: (input: PlanInput) => Promise<void>; updatePlan: (id: string, input: Partial<Plan>) => Promise<void>; deletePlan: (id: string) => Promise<void>;
  createTask: (input: TaskInput) => Promise<void>; updateTask: (id: string, input: Partial<Task>) => Promise<void>; deleteTask: (id: string) => Promise<void>;
  transitionPlan: (id: string, status: Plan["status"], note: string) => Promise<{ ok: boolean; message?: string }>;
}

const date = (value: unknown) => typeof value === "string" ? value.slice(0, 10) : "";
const text = (value: unknown) => typeof value === "string" ? value : "";
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const code = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
let hydrateRequest = 0;
const workspaceFrom = (row: Row): Workspace => ({ id: text(row.id), code: text(row.code), name: text(row.name), description: text(row.description), type: text(row.type), ownerId: text(row.ownerId), memberIds: [], planCount: 0, openTasks: 0, progress: 0, status: (text(row.status) || "Hoạt động") as Workspace["status"], deadline: date(row.deadline), createdAt: date(row.createdAt), updatedAt: date(row.updatedAt) });
const planFrom = (row: Row): Plan => ({ id: text(row.id), code: text(row.code), name: text(row.name), workspaceId: text(row.workspaceId), projectId: text(row.projectId) || undefined, module: text(row.module), parentId: text(row.parentId) || undefined, ownerId: text(row.ownerId), departmentId: "", startDate: date(row.startDate), deadline: date(row.deadline), progress: Number(row.progress ?? 0), status: text(row.status) as Plan["status"], priority: text(row.priority) as Plan["priority"], objective: text(row.objective), scope: text(row.scope), output: text(row.output), approverId: text(row.approverId), createdAt: date(row.createdAt), updatedAt: date(row.updatedAt) });
const taskFrom = (row: Row): Task => ({ id: text(row.id), code: text(row.code), name: text(row.name), planId: text(row.planId), workspaceId: text(row.workspaceId), ownerId: text(row.ownerId), assigneeId: text(row.assigneeId) || strings(row.collaboratorIds)[0] || text(row.ownerId), collaboratorIds: strings(row.collaboratorIds), status: text(row.status) as Task["status"], priority: text(row.priority) as Task["priority"], startDate: date(row.startDate), deadline: date(row.deadline), progress: Number(row.progress ?? 0), checklistDone: 0, checklistTotal: 0, comments: 0, files: 0, labels: [], note: text(row.note) || undefined, blockedReason: text(row.blockedReason) || undefined, actualResult: text(row.actualResult) || undefined, createdAt: date(row.createdAt), updatedAt: date(row.updatedAt) });
const summarize = (workspaces: Workspace[], plans: Plan[], tasks: Task[]) => ({
  workspaces: workspaces.map((workspace) => { const relatedPlans = plans.filter((plan) => plan.workspaceId === workspace.id); const relatedTasks = tasks.filter((task) => task.workspaceId === workspace.id); return { ...workspace, planCount: relatedPlans.length, openTasks: relatedTasks.filter((task) => !["Hoàn thành", "Đóng", "Hủy"].includes(task.status)).length, progress: relatedTasks.length ? Math.round(relatedTasks.reduce((total, task) => total + task.progress, 0) / relatedTasks.length) : 0 }; }),
  plans: plans.map((plan) => { const related = tasks.filter((task) => task.planId === plan.id); return { ...plan, progress: related.length ? Math.round(related.reduce((total, task) => total + task.progress, 0) / related.length) : 0 }; }), tasks,
});

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  ...summarize([], [], []), approvals: [], activities: [],
  hydrate: async () => {
    const requestId = ++hydrateRequest;
    const [workspaceRows, planRows, taskRows] = await Promise.all([http.get<Row[]>("/api/workspaces"), http.get<Row[]>("/api/plans"), http.get<Row[]>("/api/tasks")]);
    if (requestId !== hydrateRequest) return;
    set(summarize(workspaceRows.map(workspaceFrom), planRows.map(planFrom), taskRows.map(taskFrom)));
  },
  createWorkspace: async (input) => { const workspace = await http.post<Row>("/api/workspaces", { code: code("WS"), name: input.name, description: input.description, type: input.type, ownerId: input.ownerId || null }); for (const userId of [...new Set(input.memberIds ?? [])]) await http.post(`/api/workspaces/${text(workspace.id)}/members`, { userId, role: "Thành viên" }); await get().hydrate(); },
  updateWorkspace: async (id, input) => { await http.patch(`/api/workspaces/${id}`, { name: input.name, description: input.description, type: input.type, ownerId: input.ownerId || null }); await get().hydrate(); },
  deleteWorkspace: async (id) => { await http.delete(`/api/workspaces?id=${id}`); await get().hydrate(); },
  createPlan: async (input) => { await http.post("/api/plans", { code: code("KH"), name: input.name, workspaceId: input.workspaceId, module: "Chưa phân loại", objective: "", scope: "", output: "", startDate: input.startDate || null, deadline: input.deadline || null, priority: input.priority }); await get().hydrate(); },
  updatePlan: async (id, input) => { await http.patch(`/api/plans/${id}`, input); await get().hydrate(); },
  deletePlan: async (id) => { await http.delete(`/api/plans/${id}`); await get().hydrate(); },
  createTask: async (input) => { const task = await http.post<Row>("/api/tasks", { code: code("TASK"), name: input.name, planId: input.planId, workspaceId: input.workspaceId, ownerId: input.ownerId || null, assigneeId: input.assigneeId || null, assigneeIds: input.collaboratorIds, startDate: new Date().toISOString(), deadline: input.deadline || null, priority: input.priority, note: input.note || null }); await get().hydrate(); const taskId = text(task.id); for (const content of input.checklistItems ?? []) await http.post(`/api/tasks/${taskId}/checklist`, { content }); for (const fileName of input.attachmentNames ?? []) await http.post(`/api/tasks/${taskId}/attachments`, { fileName, url: null }); await get().hydrate(); },
  updateTask: async (id, input) => {
    const previousTasks = get().tasks;
    const previousPlans = get().plans;
    const previousWorkspaces = get().workspaces;
    const optimisticTasks = previousTasks.map((t) => (t.id === id ? { ...t, ...input } : t));
    set(summarize(previousWorkspaces, previousPlans, optimisticTasks));
    try {
      const { status, collaboratorIds, ...patch } = input;
      if (status) await http.post(`/api/tasks/${id}/transition`, { status, actualResult: input.actualResult, blockedReason: input.blockedReason });
      const values = { ...patch, ...(collaboratorIds ? { assigneeIds: collaboratorIds } : {}) };
      if (Object.keys(values).length) await http.patch(`/api/tasks/${id}`, values);
      await get().hydrate();
    } catch (err) {
      set(summarize(previousWorkspaces, previousPlans, previousTasks));
      throw err;
    }
  },
  deleteTask: async (id) => {
    const previousTasks = get().tasks;
    const previousPlans = get().plans;
    const previousWorkspaces = get().workspaces;
    set(summarize(previousWorkspaces, previousPlans, previousTasks.filter((t) => t.id !== id)));
    try {
      await http.delete(`/api/tasks/${id}`);
      await get().hydrate();
    } catch (err) {
      set(summarize(previousWorkspaces, previousPlans, previousTasks));
      throw err;
    }
  },
  transitionPlan: async (id, status, note) => { try { await http.post(`/api/plans/${id}/transition`, { status, note }); await get().hydrate(); return { ok: true }; } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Không thể chuyển trạng thái kế hoạch." }; } },
}));
