import { z } from "zod";

export const workspaceInputSchema = z.object({
  code: z.string().trim().min(3).max(50),
  name: z.string().trim().min(3).max(255),
  description: z.string().trim().min(3),
  type: z.string().trim().min(2).max(50),
  ownerId: z.string().uuid().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  status: z.enum(["Hoạt động", "Lưu trữ"]).optional(),
});

const planFields = z.object({
    code: z.string().trim().min(3).max(50),
    name: z.string().trim().min(3).max(255),
    workspaceId: z.string().uuid(),
    projectId: z.string().uuid().nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    module: z.string().trim().min(1).max(100),
    objective: z.string().default(""),
    scope: z.string().default(""),
    output: z.string().default(""),
    ownerId: z.string().uuid().nullable().optional(),
    approverId: z.string().uuid().nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    deadline: z.coerce.date().nullable().optional(),
    priority: z.enum(["Cao", "Trung bình", "Thấp"]).optional(),
    status: z.enum(["Nháp", "Chờ duyệt", "Đã duyệt", "Đang thực hiện", "Tạm dừng", "Chờ nghiệm thu", "Hoàn thành", "Đóng", "Từ chối", "Hủy"]).optional(),
  });

export const planInputSchema = planFields
  .refine((data) => !data.startDate || !data.deadline || data.deadline >= data.startDate, {
    message: "Deadline không được nhỏ hơn ngày bắt đầu.",
    path: ["deadline"],
  });
export const planPatchSchema = planFields.partial();

const taskFields = z.object({
    code: z.string().trim().min(3).max(50),
    name: z.string().trim().min(3).max(255),
    planId: z.string().uuid(),
    workspaceId: z.string().uuid(),
    ownerId: z.string().uuid().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    assigneeIds: z.array(z.string().uuid()).min(1).optional(),
    status: z.enum(["Chưa thực hiện", "Đang thực hiện", "Cần hỗ trợ", "Chờ phối hợp", "Chờ phản hồi", "Chờ duyệt", "Bị chặn", "Hoàn thành", "Làm lại", "Đóng", "Hủy"]).optional(),
    priority: z.enum(["Cao", "Trung bình", "Thấp"]).optional(),
    startDate: z.coerce.date().nullable().optional(),
    deadline: z.coerce.date().nullable().optional(),
    note: z.string().nullable().optional(),
    actualResult: z.string().nullable().optional(),
    blockedReason: z.string().nullable().optional(),
  });

export const taskInputSchema = taskFields
  .refine((data) => !data.startDate || !data.deadline || data.deadline >= data.startDate, {
    message: "Deadline không được nhỏ hơn ngày bắt đầu.",
    path: ["deadline"],
  });
export const taskPatchSchema = taskFields.partial().extend({ progress: z.number().int().min(0).max(100).optional() });
export const taskProgressPatchSchema = z.object({ progress: z.number().int().min(0).max(100) });

export const uuidSchema = z.string().uuid();
