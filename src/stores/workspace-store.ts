import { create } from "zustand";
import { plans as initialPlans, tasks as initialTasks, workspaces as initialWorkspaces } from "@/lib/mock-data/data";
import type { ActivityLog, Approval, Plan, Task, Workspace } from "@/types/domain";

type WorkspaceInput = Pick<Workspace, "name" | "description" | "type"> & Partial<Pick<Workspace, "departmentId" | "departmentIds" | "ownerId" | "memberIds">>;
type PlanInput = Pick<Plan, "name" | "workspaceId" | "startDate" | "deadline" | "priority">;
type TaskInput = Pick<Task, "name" | "planId" | "workspaceId" | "ownerId" | "deadline" | "priority"> & Partial<Pick<Task, "note" | "attachmentNames" | "checklistItems" | "checklistDone" | "checklistTotal" | "files">>;

interface WorkspaceStore {
  workspaces: Workspace[];
  plans: Plan[];
  tasks: Task[];
  approvals: Approval[];
  activities: ActivityLog[];
  createWorkspace: (input: WorkspaceInput) => void;
  updateWorkspace: (id: string, input: WorkspaceInput) => void;
  deleteWorkspace: (id: string) => void;
  createPlan: (input: PlanInput) => void;
  updatePlan: (id: string, input: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  createTask: (input: TaskInput) => void;
  updateTask: (id: string, input: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  transitionPlan: (id: string, status: Plan["status"], note: string) => { ok: boolean; message?: string };
}

const now = "2026-08-15";
const uid = () => crypto.randomUUID();
const withSummaries = (workspaces: Workspace[], plans: Plan[], tasks: Task[]) => ({
  workspaces: workspaces.map((workspace) => {
    const relatedPlans = plans.filter((plan) => plan.workspaceId === workspace.id);
    const relatedTasks = tasks.filter((task) => task.workspaceId === workspace.id);
    const progress = relatedTasks.length
      ? Math.round(relatedTasks.reduce((total, task) => total + task.progress, 0) / relatedTasks.length)
      : 0;
    return { ...workspace, planCount: relatedPlans.length, openTasks: relatedTasks.filter((task) => !["Hoàn thành", "Đóng", "Hủy"].includes(task.status)).length, progress };
  }),
  plans: plans.map((plan) => {
    const relatedTasks = tasks.filter((task) => task.planId === plan.id);
    const progress = relatedTasks.length ? Math.round(relatedTasks.reduce((total, task) => total + task.progress, 0) / relatedTasks.length) : 0;
    return { ...plan, progress };
  }),
  tasks,
});

const standardWorkspace: Workspace = { ...initialWorkspaces[0], id: "ws-standard", code: "WS-ERP-001", name: "Triển khai ERP & AI Platform", description: "Quy trình chuẩn từ khởi tạo Workspace đến nghiệm thu, hoàn thành và đóng kế hoạch.", type: "Chương trình", departmentIds: ["d1", "d2", "d3", "d4"], ownerId: "u1", memberIds: ["u1", "u3", "u4", "u5"], planCount: 1, openTasks: 4, progress: 0, status: "Hoạt động", deadline: "2026-10-30", createdAt: now, updatedAt: now };
const standardPlan: Plan = { ...initialPlans[0], id: "plan-standard", code: "KH-ERP-001", name: "Kế hoạch triển khai ERP & AI Platform", workspaceId: "ws-standard", module: "ERP Core", ownerId: "u1", departmentId: "d1", startDate: "2026-08-15", deadline: "2026-10-30", progress: 0, status: "Đang thực hiện", priority: "Cao", objective: "Chuẩn hóa và đưa vào vận hành các phân hệ ERP cốt lõi.", scope: "OM, Tech, BA, QA và các đơn vị sử dụng.", output: "Hệ thống ERP được nghiệm thu và hướng dẫn vận hành.", approverId: "u2", createdAt: now, updatedAt: now };
const standardTasks: Task[] = [
  { ...initialTasks[0], id: "task-standard-1", code: "TASK-ERP-001", name: "Làm rõ yêu cầu nghiệp vụ", planId: "plan-standard", workspaceId: "ws-standard", ownerId: "u4", status: "Hoàn thành", progress: 100, checklistDone: 2, checklistTotal: 2, actualResult: "Đã chốt tài liệu yêu cầu nghiệp vụ.", startDate: "2026-08-15", deadline: "2026-08-20", createdAt: now, updatedAt: now },
  { ...initialTasks[1], id: "task-standard-2", code: "TASK-ERP-002", name: "Thiết kế kế hoạch triển khai", planId: "plan-standard", workspaceId: "ws-standard", ownerId: "u1", status: "Đang thực hiện", progress: 60, checklistDone: 1, checklistTotal: 2, startDate: "2026-08-21", deadline: "2026-08-28", createdAt: now, updatedAt: now },
  { ...initialTasks[2], id: "task-standard-3", code: "TASK-ERP-003", name: "Cấu hình và phát triển chức năng", planId: "plan-standard", workspaceId: "ws-standard", ownerId: "u3", status: "Chưa thực hiện", progress: 0, checklistDone: 0, checklistTotal: 3, startDate: "2026-08-29", deadline: "2026-09-25", createdAt: now, updatedAt: now },
  { ...initialTasks[3], id: "task-standard-4", code: "TASK-ERP-004", name: "Kiểm thử và nghiệm thu", planId: "plan-standard", workspaceId: "ws-standard", ownerId: "u5", status: "Chờ phối hợp", progress: 0, checklistDone: 0, checklistTotal: 2, startDate: "2026-09-26", deadline: "2026-10-15", createdAt: now, updatedAt: now },
];

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  ...withSummaries([standardWorkspace], [standardPlan], standardTasks),
  approvals: [],
  activities: [],
  createWorkspace: (input) => set((state) => withSummaries([{ ...initialWorkspaces[0], ...input, id: uid(), code: `WS-NEW-${String(state.workspaces.length + 1).padStart(3, "0")}`, memberIds: input.memberIds?.length ? input.memberIds : [input.ownerId ?? "u1"], ownerId: input.ownerId ?? "u1", planCount: 0, openTasks: 0, progress: 0, status: "Hoạt động", createdAt: now, updatedAt: now, deadline: "2026-12-31" }, ...state.workspaces], state.plans, state.tasks)),
  updateWorkspace: (id, input) => set((state) => ({ workspaces: state.workspaces.map((item) => item.id === id ? { ...item, ...input, updatedAt: now } : item) })),
  deleteWorkspace: (id) => set((state) => ({ workspaces: state.workspaces.filter((item) => item.id !== id), plans: state.plans.filter((item) => item.workspaceId !== id), tasks: state.tasks.filter((item) => item.workspaceId !== id) })),
  createPlan: (input) => set((state) => withSummaries(state.workspaces, [{ ...initialPlans[0], ...input, id: uid(), code: `KH-NEW-${String(state.plans.length + 1).padStart(3, "0")}`, module: "Chưa phân loại", ownerId: "u1", departmentId: "d1", progress: 0, status: "Nháp", objective: "Xác định sau khi tạo kế hoạch", scope: "Theo Workspace đã chọn", output: "Kế hoạch triển khai", approverId: "u2", createdAt: now, updatedAt: now }, ...state.plans], state.tasks)),
  updatePlan: (id, input) => set((state) => {
    const plans = state.plans.map((item) => item.id === id ? { ...item, ...input, updatedAt: now } : item);
    const workspaceId = plans.find((plan) => plan.id === id)?.workspaceId;
    const tasks = workspaceId ? state.tasks.map((task) => task.planId === id ? { ...task, workspaceId } : task) : state.tasks;
    return withSummaries(state.workspaces, plans, tasks);
  }),
  deletePlan: (id) => set((state) => withSummaries(state.workspaces, state.plans.filter((item) => item.id !== id), state.tasks.filter((item) => item.planId !== id))),
  createTask: (input) => set((state) => withSummaries(state.workspaces, state.plans, [{ ...initialTasks[0], ...input, id: uid(), code: `TASK-NEW-${String(state.tasks.length + 1).padStart(3, "0")}`, collaboratorIds: [], status: "Chưa thực hiện", startDate: now, progress: 0, checklistDone: 0, checklistTotal: 0, comments: 0, files: 0, labels: [], createdAt: now, updatedAt: now }, ...state.tasks])),
  updateTask: (id, input) => set((state) => withSummaries(state.workspaces, state.plans, state.tasks.map((item) => item.id === id ? { ...item, ...input, updatedAt: now } : item))),
  deleteTask: (id) => set((state) => withSummaries(state.workspaces, state.plans, state.tasks.filter((item) => item.id !== id))),
  transitionPlan: (id, status, note) => {
    let result: { ok: boolean; message?: string } = { ok: true };
    set((state) => {
      const plan = state.plans.find((item) => item.id === id);
      if (!plan) return state;
      const relatedTasks = state.tasks.filter((task) => task.planId === id);
      if (status === "Đóng" && relatedTasks.some((task) => task.status !== "Hoàn thành" && task.status !== "Đóng")) {
        result = { ok: false, message: "Chỉ được đóng khi các Task bắt buộc đã hoàn thành." };
        return state;
      }
      if ((status === "Từ chối" || status === "Tạm dừng") && !note.trim()) {
        result = { ok: false, message: "Vui lòng nhập lý do cho thao tác này." };
        return state;
      }
      const approval: Approval = { id: uid(), code: `APR-${Date.now()}`, entityId: id, action: status, approverId: "u2", note, status: status === "Từ chối" ? "Từ chối" : status === "Chờ duyệt" ? "Chờ duyệt" : "Đã duyệt", createdAt: now, updatedAt: now };
      const activity: ActivityLog = { id: uid(), code: `LOG-${Date.now()}`, entityId: id, actorId: "u1", action: `Chuyển trạng thái: ${status}`, description: note || "Cập nhật theo quy trình kế hoạch", status: "Thành công", createdAt: now, updatedAt: now };
      return { ...withSummaries(state.workspaces, state.plans.map((item) => item.id === id ? { ...item, status, progress: status === "Hoàn thành" ? 100 : item.progress, updatedAt: now } : item), state.tasks), approvals: [approval, ...state.approvals], activities: [activity, ...state.activities] };
    });
    return result;
  },
}));
