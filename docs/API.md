# REST API Workspace

API được xây dựng bằng Next.js Route Handlers, Drizzle ORM và PostgreSQL Neon. Mọi response thành công có dạng `{ "data": ... }`; lỗi validation có status `400` và trường `error`.

## Nghiệp vụ chính

| Tài nguyên | Endpoint |
| --- | --- |
| Workspace | `GET/POST /api/workspaces`, `GET/PATCH /api/workspaces/:id`, `DELETE /api/workspaces?id=:id` |
| Thành viên Workspace | `GET/POST /api/workspaces/:id/members`, `DELETE /api/workspaces/:id/members?userId=:id` |
| Kế hoạch | `GET/POST /api/plans`, `GET/PATCH/DELETE /api/plans/:id` |
| Luồng kế hoạch | `POST /api/plans/:id/transition` |
| Công việc | `GET/POST /api/tasks`, `GET/PATCH/DELETE /api/tasks/:id` |
| Luồng công việc | `POST /api/tasks/:id/transition` |
| Người thực hiện | `GET/POST /api/tasks/:id/assignees`, `DELETE /api/tasks/:id/assignees?userId=:id` |
| Checklist | `GET/POST/PATCH/DELETE /api/tasks/:id/checklist` |
| Công việc con | `GET/POST/PATCH/DELETE /api/tasks/:id/subtasks` |
| Bình luận | `GET/POST /api/tasks/:id/comments` |
| Tài liệu Task | `GET/POST/DELETE /api/tasks/:id/attachments` |

## Dữ liệu danh mục và tổng hợp

| Tài nguyên | Endpoint |
| --- | --- |
| Phòng ban | `GET/POST /api/departments` |
| Người dùng | `GET/POST /api/users` |
| Dự án | `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id` |
| Nhóm công việc | `GET/POST /api/work-groups`, `GET/PATCH/DELETE /api/work-groups/:id` |
| Dashboard | `GET /api/dashboard` |

## Quy tắc đã thực thi

- Deadline của kế hoạch/công việc không được sớm hơn ngày bắt đầu khi tạo mới.
- Chuyển Task sang `Bị chặn` bắt buộc có nguyên nhân.
- Chuyển Task sang `Hoàn thành` bắt buộc có kết quả thực tế và hoàn tất checklist bắt buộc.
- Sau mọi tạo, sửa, xóa hoặc chuyển trạng thái Task, tiến độ Plan được tính lại từ các Task liên quan.
- Đóng Plan bị từ chối nếu còn Task chưa hoàn thành/đóng/hủy.
- Chuyển trạng thái Plan/Task ghi vào `activity_logs`; các mốc duyệt chính được ghi vào `approvals`.

Ví dụ chuyển trạng thái công việc:

```json
POST /api/tasks/{taskId}/transition
{
  "status": "Chờ duyệt",
  "actorId": "uuid-nguoi-thao-tac",
  "note": "Đã hoàn tất và gửi quản lý nghiệm thu.",
  "actualResult": "Đã bàn giao tài liệu UAT."
}
```
