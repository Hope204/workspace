"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { users } from "@/lib/mock-data/data";
import { statusStyle } from "@/lib/status";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workspace } from "@/types/domain";

const tabs = ["Tổng quan", "Kế hoạch", "Công việc", "Thành viên", "Tài liệu", "Hoạt động", "Cấu hình"] as const;
export function WorkspaceDetailDrawer({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Tổng quan");
  const plans = useWorkspaceStore((state) => state.plans).filter((item) => item.workspaceId === workspace.id);
  const tasks = useWorkspaceStore((state) => state.tasks).filter((item) => item.workspaceId === workspace.id);
  const body = tab === "Tổng quan" ? <div className="space-y-4"><p className="text-sm text-slate-600">{workspace.description}</p><div className="grid grid-cols-2 gap-3 text-sm"><p><span className="text-slate-500">Owner</span><br/><b>{users.find((user) => user.id === workspace.ownerId)?.name}</b></p><p><span className="text-slate-500">Deadline</span><br/><b>{workspace.deadline}</b></p><p><span className="text-slate-500">Kế hoạch</span><br/><b>{plans.length}</b></p><p><span className="text-slate-500">Task đang mở</span><br/><b>{tasks.filter((task) => task.status !== "Hoàn thành").length}</b></p></div><div><p className="mb-1 text-sm font-semibold">Tiến độ {workspace.progress}%</p><div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-blue-600" style={{width:`${workspace.progress}%`}}/></div></div></div> : tab === "Kế hoạch" ? <div>{plans.map((plan) => <div className="border-b py-3 text-sm" key={plan.id}><b>{plan.name}</b><p className="text-slate-500">{plan.progress}% · {plan.status}</p></div>)}</div> : tab === "Công việc" ? <div>{tasks.map((task) => <div className="border-b py-3 text-sm" key={task.id}><b>{task.name}</b><p className="text-slate-500">{task.deadline} · {task.status} · {task.progress}%</p></div>)}</div> : tab === "Thành viên" ? <div>{workspace.memberIds.map((id) => <div className="flex items-center justify-between border-b py-3 text-sm" key={id}><b>{users.find((user) => user.id === id)?.name}</b><span className="text-slate-500">{users.find((user) => user.id === id)?.role}</span></div>)}</div> : <p className="sub">Chưa có dữ liệu mock cho tab {tab}.</p>;
  return <aside className="drawer" role="dialog" aria-modal="true"><div className="drawer-card"><div className="flex justify-between"><div><span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{workspace.code}</span><h2 className="mt-3">{workspace.name}</h2><span className={`mt-2 inline-block rounded px-2 py-1 text-xs ${statusStyle["Đang thực hiện"]}`}>{workspace.status}</span></div><button onClick={onClose}><X/></button></div><nav className="mt-5 flex gap-2 overflow-x-auto border-b pb-2">{tabs.map((item) => <button className={tab === item ? "border-b-2 border-blue-600 pb-2 text-sm font-semibold text-blue-700" : "pb-2 text-sm text-slate-500"} onClick={() => setTab(item)} key={item}>{item}</button>)}</nav><div className="mt-5">{body}</div></div></aside>;
}
