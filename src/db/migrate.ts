import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not configured");

const sql = neon(url);

async function run() {
  console.log("Creating tables matching Drizzle schema in Neon PostgreSQL database...");

  // Drop existing conflicting legacy tables if empty or recreate
  await sql`DROP TABLE IF EXISTS activity_logs, notifications, risk_issues, approvals, attachments, comments, subtasks, checklist_items, task_assignees, tasks, work_groups, plans, projects, workspace_members, workspaces, users, departments CASCADE;`;
  await sql`DROP TYPE IF EXISTS workspace_status, plan_status, task_status, priority, role CASCADE;`;

  // Create Types
  await sql`CREATE TYPE workspace_status AS ENUM ('Hoạt động', 'Lưu trữ');`;
  await sql`CREATE TYPE plan_status AS ENUM ('Nháp', 'Chờ duyệt', 'Đã duyệt', 'Đang thực hiện', 'Tạm dừng', 'Chờ nghiệm thu', 'Hoàn thành', 'Đóng', 'Từ chối', 'Hủy');`;
  await sql`CREATE TYPE task_status AS ENUM ('Chưa thực hiện', 'Đang thực hiện', 'Cần hỗ trợ', 'Chờ phối hợp', 'Chờ phản hồi', 'Chờ duyệt', 'Bị chặn', 'Hoàn thành', 'Làm lại', 'Đóng', 'Hủy');`;
  await sql`CREATE TYPE priority AS ENUM ('Cao', 'Trung bình', 'Thấp');`;

  // Create Tables
  await sql`CREATE TABLE departments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(30) UNIQUE NOT NULL, name VARCHAR(150) NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(30) UNIQUE NOT NULL, username VARCHAR(80), password_hash VARCHAR(128), name VARCHAR(150) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, role VARCHAR(80) NOT NULL, department_id UUID REFERENCES departments(id), created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE workspaces (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, description TEXT NOT NULL, type VARCHAR(50) NOT NULL, owner_id UUID REFERENCES users(id), status workspace_status DEFAULT 'Hoạt động' NOT NULL, deadline TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE workspace_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id), role VARCHAR(50) NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, CONSTRAINT workspace_members_workspace_user_unique UNIQUE (workspace_id, user_id));`;

  await sql`CREATE TABLE projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, project_id UUID REFERENCES projects(id), parent_id UUID, module VARCHAR(100) NOT NULL, objective TEXT NOT NULL, scope TEXT NOT NULL, output TEXT NOT NULL, owner_id UUID REFERENCES users(id), approver_id UUID REFERENCES users(id), start_date TIMESTAMPTZ, deadline TIMESTAMPTZ, progress INT DEFAULT 0 NOT NULL, status plan_status DEFAULT 'Nháp' NOT NULL, priority priority DEFAULT 'Trung bình' NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE work_groups (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE, workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, owner_id UUID REFERENCES users(id), assignee_id UUID REFERENCES users(id), status task_status DEFAULT 'Chưa thực hiện' NOT NULL, priority priority DEFAULT 'Trung bình' NOT NULL, start_date TIMESTAMPTZ, deadline TIMESTAMPTZ, progress INT DEFAULT 0 NOT NULL, note TEXT, actual_result TEXT, blocked_reason TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE task_assignees (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id), role VARCHAR(30) NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, CONSTRAINT task_assignees_task_user_role_unique UNIQUE (task_id, user_id, role));`;

  await sql`CREATE TABLE checklist_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, content TEXT NOT NULL, required BOOLEAN DEFAULT true NOT NULL, completed BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, CONSTRAINT checklist_items_task_content_unique UNIQUE (task_id, content));`;

  await sql`CREATE TABLE subtasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, completed BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE comments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, author_id UUID REFERENCES users(id), content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE attachments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), entity_type VARCHAR(30) NOT NULL, entity_id UUID NOT NULL, file_name VARCHAR(255) NOT NULL, url TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE approvals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), entity_type VARCHAR(30) NOT NULL, entity_id UUID NOT NULL, action VARCHAR(50) NOT NULL, approver_id UUID REFERENCES users(id), note TEXT, status VARCHAR(30) NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE activity_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), entity_type VARCHAR(30) NOT NULL, entity_id UUID NOT NULL, actor_id UUID REFERENCES users(id), action VARCHAR(100) NOT NULL, description TEXT, metadata JSONB, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE risk_issues (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, severity priority DEFAULT 'Trung bình' NOT NULL, status VARCHAR(30) DEFAULT 'Mở' NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  await sql`CREATE TABLE notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), title VARCHAR(255) NOT NULL, content TEXT NOT NULL, read BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);`;

  console.log("Database schema initialized successfully!");
}

run().catch(console.error);
