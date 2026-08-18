import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { checklistItems, departments, plans, taskAssignees, tasks, users, workspaceMembers, workspaces } from "./schema";
import { hashPassword } from "../lib/auth/password";

config({ path: ".env.local" });
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
const db = drizzle({ client: neon(databaseUrl) });
type SeedTaskStatus = NonNullable<typeof tasks.$inferInsert.status>;

const ids = {
  bod: "10000000-0000-4000-8000-000000000001", om: "10000000-0000-4000-8000-000000000002", tech: "10000000-0000-4000-8000-000000000003", prod: "10000000-0000-4000-8000-000000000004", finance: "10000000-0000-4000-8000-000000000005",
  phuong: "20000000-0000-4000-8000-000000000001", ha: "20000000-0000-4000-8000-000000000002", giang: "20000000-0000-4000-8000-000000000003", dao: "20000000-0000-4000-8000-000000000004", hieu: "20000000-0000-4000-8000-000000000005", linh: "20000000-0000-4000-8000-000000000006", binh: "20000000-0000-4000-8000-000000000007", viet: "20000000-0000-4000-8000-000000000008",
};

const workspaceRows = [
  ["30000000-0000-4000-8000-000000000001", "WS-ERP-001", "Triển khai ERP & AI Platform", "Chương trình chuẩn hóa ERP và AI nội bộ.", "Chương trình", ids.phuong, "2026-10-30"],
  ["30000000-0000-4000-8000-000000000002", "WS-PROD-001", "Phòng Sản xuất", "Tối ưu quy trình sản xuất in ấn.", "Phòng ban", ids.phuong, "2026-09-25"],
  ["30000000-0000-4000-8000-000000000003", "WS-SALES-001", "Phòng Kinh doanh", "Theo dõi chuyển đổi CRM và doanh số.", "Phòng ban", ids.phuong, "2026-09-10"],
  ["30000000-0000-4000-8000-000000000004", "WS-M00-001", "Triển khai Module M00", "Khởi tạo master data ERP.", "Dự án", ids.phuong, "2026-09-30"],
  ["30000000-0000-4000-8000-000000000005", "WS-M01-001", "Triển khai Module M01", "Quản lý đơn hàng và sản xuất.", "Dự án", ids.phuong, "2026-10-15"],
] as const;

async function seed() {
  await db.insert(departments).values([
    { id: ids.bod, code: "BOD", name: "Ban điều hành" }, { id: ids.om, code: "OM", name: "OM" }, { id: ids.tech, code: "TECH", name: "TECH" }, { id: ids.prod, code: "SX", name: "Sản xuất" }, { id: ids.finance, code: "KT", name: "Kế toán" },
  ]).onConflictDoNothing();
  await db.insert(users).values([
    { id: ids.phuong, code: "U-OM-001", username: "phuong.om", passwordHash: hashPassword("OM@2026"), name: "Lê Võ Mai Phương", email: "phuong@thanhdanh.vn", role: "OM", departmentId: ids.om }, { id: ids.giang, code: "U-TECH-BA", username: "giang.ba", passwordHash: hashPassword("User@2026"), name: "Võ Thị Hương Giang", email: "giang@thanhdanh.vn", role: "User", departmentId: ids.tech }, { id: ids.dao, code: "U-TECH-QA", username: "dao.qa", passwordHash: hashPassword("User@2026"), name: "Bùi Thị Hồng Đào", email: "dao@thanhdanh.vn", role: "User", departmentId: ids.tech }, { id: ids.hieu, code: "U-TECH-AI", username: "hieu.ai", passwordHash: hashPassword("Manager@2026"), name: "Trần Thanh Hiếu", email: "hieu@thanhdanh.vn", role: "Manager", departmentId: ids.tech },
  ]).onConflictDoNothing();
  await Promise.all([
    db.update(users).set({ username: "phuong.om", passwordHash: hashPassword("OM@2026"), role: "OM", updatedAt: new Date() }).where(eq(users.id, ids.phuong)),
    db.update(users).set({ username: "giang.ba", passwordHash: hashPassword("User@2026"), role: "User", updatedAt: new Date() }).where(eq(users.id, ids.giang)),
    db.update(users).set({ username: "dao.qa", passwordHash: hashPassword("User@2026"), role: "User", updatedAt: new Date() }).where(eq(users.id, ids.dao)),
    db.update(users).set({ username: "hieu.ai", passwordHash: hashPassword("Manager@2026"), role: "Manager", updatedAt: new Date() }).where(eq(users.id, ids.hieu)),
  ]);
  await db.insert(workspaces).values(workspaceRows.map(([id, code, name, description, type, ownerId, deadline]) => ({ id, code, name, description, type, ownerId, deadline: new Date(deadline), status: "Hoạt động" as const }))).onConflictDoNothing();
  await db.insert(workspaceMembers).values(workspaceRows.flatMap(([workspaceId]) => [ids.phuong, ids.giang, ids.dao, ids.hieu].map((userId) => ({ workspaceId, userId, role: userId === ids.phuong ? "Owner" : "Thành viên" })))).onConflictDoNothing();

  const planRows = Array.from({ length: 8 }, (_, index) => ({
    id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    code: index < 2 ? `KH-ERP-M00-00${index + 1}` : index < 4 ? `KH-ERP-M01-00${index - 1}` : `KH-ERP-00${index + 1}`,
    name: ["Lập kế hoạch triển khai ERP", "Chuẩn hóa Master Data", "Triển khai quản lý đơn hàng M01", "Kiểm thử tích hợp M01", "AI trợ lý tra cứu SOP", "Số hóa lệnh sản xuất", "Chuẩn hóa CRM", "Đối soát chi phí sản xuất"][index],
    workspaceId: workspaceRows[index % workspaceRows.length][0], module: index < 4 ? index < 2 ? "M00" : "M01" : "ERP Core", objective: "Hoàn thành đầu ra theo kế hoạch triển khai.", scope: "Các đơn vị liên quan trong Workspace.", output: "Tài liệu và kết quả nghiệm thu.", ownerId: index % 2 ? ids.giang : ids.phuong, approverId: ids.phuong, startDate: new Date("2026-08-15"), deadline: new Date(`2026-10-${String(10 + index).padStart(2, "0")}`), status: index === 7 ? "Hoàn thành" as const : "Đang thực hiện" as const, priority: index % 3 === 0 ? "Cao" as const : "Trung bình" as const,
  }));
  await db.insert(plans).values(planRows).onConflictDoNothing();
  const taskRows = Array.from({ length: 25 }, (_, index) => {
    const plan = planRows[index % planRows.length]; const completed = index % 6 === 0; const status: SeedTaskStatus = completed ? "Hoàn thành" : index % 5 === 0 ? "Cần hỗ trợ" : index % 8 === 0 ? "Bị chặn" : index % 3 === 0 ? "Chưa thực hiện" : "Đang thực hiện";
    const assignerId = ids.phuong; const assigneeId = [ids.giang, ids.dao, ids.hieu, ids.giang][index % 4];
    return { id: `50000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, code: `TASK-${plan.module}-${String(index + 1).padStart(3, "0")}`, name: ["Làm rõ yêu cầu nghiệp vụ", "Thiết kế biểu mẫu và dữ liệu", "Cấu hình chức năng", "Kiểm thử nghiệp vụ", "Đào tạo người dùng"][index % 5], planId: plan.id, workspaceId: plan.workspaceId, ownerId: assignerId, assigneeId, status, priority: index % 4 === 0 ? "Cao" as const : "Trung bình" as const, startDate: new Date("2026-08-15"), deadline: new Date(`2026-09-${String(5 + (index % 20)).padStart(2, "0")}`), progress: completed ? 100 : (index * 11) % 85, actualResult: completed ? "Đã hoàn tất và bàn giao kết quả." : null, blockedReason: status === "Bị chặn" ? "Chờ xác nhận nghiệp vụ từ đơn vị sử dụng." : null };
  });
  await db.insert(tasks).values(taskRows).onConflictDoNothing();
  await db.insert(taskAssignees).values(taskRows.flatMap((task) => [{ taskId: task.id, userId: task.assigneeId!, role: "Chính" }, { taskId: task.id, userId: task.ownerId!, role: "Giao việc" }])).onConflictDoNothing();
  await db.insert(checklistItems).values(taskRows.slice(0, 8).flatMap((task) => [{ taskId: task.id, content: "Hoàn tất tài liệu đầu vào", required: true, completed: task.status === "Hoàn thành" }, { taskId: task.id, content: "Cập nhật kết quả thực hiện", required: true, completed: task.status === "Hoàn thành" }])).onConflictDoNothing();
  console.log("Đã seed 5 Workspace, 8 kế hoạch, 25 công việc và dữ liệu liên kết.");
}

seed().catch((error) => { console.error(error); process.exitCode = 1; });
