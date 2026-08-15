export type PlanStatus = "Nháp" | "Chờ duyệt" | "Đã duyệt" | "Đang thực hiện" | "Tạm dừng" | "Chờ nghiệm thu" | "Hoàn thành" | "Đóng" | "Từ chối" | "Hủy";
export type TaskStatus = "Chưa thực hiện" | "Đang thực hiện" | "Chờ phối hợp" | "Chờ phản hồi" | "Chờ duyệt" | "Bị chặn" | "Hoàn thành" | "Làm lại" | "Đóng" | "Hủy";
export type Priority = "Cao" | "Trung bình" | "Thấp";
export interface Entity { id: string; code: string; createdAt: string; updatedAt: string }
export interface Department extends Entity { name: string; status: "Hoạt động" | "Ngừng" }
export interface User extends Entity { name: string; email: string; initials: string; role: string; departmentId: string }
export interface Workspace extends Entity { name: string; description: string; type: string; departmentId?: string; departmentIds?: string[]; ownerId: string; memberIds: string[]; planCount: number; openTasks: number; progress: number; status: "Hoạt động" | "Lưu trữ"; deadline: string }
export interface WorkspaceMember extends Entity { workspaceId: string; userId: string; role: string; status: "Hoạt động" | "Đã rời" }
export interface Project extends Entity { name: string; workspaceId: string; status: PlanStatus }
export interface PlanObjective extends Entity { planId: string; content: string; metric?: string; status: "Hoạt động" | "Đóng" }
export interface Plan extends Entity { name: string; workspaceId: string; projectId?: string; module: string; parentId?: string; ownerId: string; departmentId: string; startDate: string; deadline: string; progress: number; status: PlanStatus; priority: Priority; objective: string; scope: string; output: string; approverId: string }
export interface WorkGroup extends Entity { planId: string; name: string; status: PlanStatus }
export interface Task extends Entity { name: string; planId: string; workspaceId: string; ownerId: string; collaboratorIds: string[]; status: TaskStatus; priority: Priority; startDate: string; deadline: string; progress: number; checklistDone: number; checklistTotal: number; comments: number; files: number; labels: string[]; note?: string; attachmentNames?: string[]; checklistItems?: string[]; blockedReason?: string; actualResult?: string }
export interface TaskAssignee extends Entity { taskId: string; userId: string; role: "Chính" | "Phối hợp" | "Theo dõi" | "Duyệt" }
export interface Subtask extends Entity { taskId: string; name: string; status: TaskStatus; completed: boolean }
export interface ChecklistItem extends Entity { taskId: string; content: string; required: boolean; completed: boolean }
export interface Comment extends Entity { taskId: string; userId: string; content: string; status: "Hiển thị" | "Ẩn" }
export interface Attachment extends Entity { name: string; entityId: string; entityType: "plan" | "task"; size: string; status: "Hoạt động" | "Đã xóa" }
export interface Approval extends Entity { entityId: string; action: string; approverId: string; note: string; status: "Chờ duyệt" | "Đã duyệt" | "Từ chối" }
export interface RiskIssue extends Entity { planId: string; title: string; severity: Priority; status: "Mở" | "Đã xử lý" }
export interface Notification extends Entity { title: string; content: string; read: boolean; status: "Mới" | "Đã đọc" }
export interface ActivityLog extends Entity { entityId: string; actorId: string; action: string; description: string; status: "Thành công" | "Ghi nhận" }
export interface KPIEvaluation extends Entity { name: string; target: number; actual: number; unit: string; status: "Đạt" | "Cần chú ý" }
