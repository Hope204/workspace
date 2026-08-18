"use client";
import { X } from "lucide-react";
import { useWorkspaceDetail } from "./use-workspace-detail";
import type { Workspace } from "@/types/domain";

type Detail = { members?: Array<{ id: string; name: string; role: string }>; plans?: Array<{ id: string; name: string; status: string; progress: number }>; tasks?: Array<{ id: string; name: string; status: string; progress: number }>; summary?: { progress: number; completedTasks: number; overdueTasks: number } };
export function WorkspaceDetailDrawer({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const query = useWorkspaceDetail(workspace.id);
  const detail = query.data as Detail | undefined;
  return <aside className="drawer" role="dialog" aria-modal="true"><div className="drawer-card"><button className="float-right" onClick={onClose} aria-label="Đóng"><X /></button><span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{workspace.code}</span><h2 className="mt-3">{workspace.name}</h2>{query.isLoading ? <p className="sub mt-5">Đang tải dữ liệu từ Neon...</p> : <div className="mt-5 space-y-5"><p className="text-sm text-slate-600">{workspace.description}</p><div className="grid grid-cols-3 gap-3"><div className="card"><small>Tiến độ</small><b>{detail?.summary?.progress ?? workspace.progress}%</b></div><div className="card"><small>Hoàn thành</small><b>{detail?.summary?.completedTasks ?? 0}</b></div><div className="card"><small>Quá hạn</small><b>{detail?.summary?.overdueTasks ?? 0}</b></div></div><section><h3>Thành viên</h3>{detail?.members?.map((member) => <p className="border-b py-2 text-sm" key={member.id}><b>{member.name}</b> · {member.role}</p>)}</section><section><h3>Kế hoạch</h3>{detail?.plans?.map((plan) => <p className="border-b py-2 text-sm" key={plan.id}>{plan.name} · {plan.progress}% · {plan.status}</p>)}</section><section><h3>Công việc</h3>{detail?.tasks?.map((task) => <p className="border-b py-2 text-sm" key={task.id}>{task.name} · {task.progress}% · {task.status}</p>)}</section></div>}</div></aside>;
}
