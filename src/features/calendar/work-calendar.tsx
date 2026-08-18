"use client";

import { addDays, eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";
import { users } from "@/lib/mock-data/data";
import { statusStyle } from "@/lib/status";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { TaskDetailDrawer } from "@/features/tasks/task-detail-drawer";
import type { Task } from "@/types/domain";

export function WorkCalendar() {
  const tasks = useWorkspaceStore((state) => state.tasks);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const [mode, setMode] = useState<"Tháng" | "Tuần" | "Agenda">("Tháng");
  const [workspaceId, setWorkspaceId] = useState("all");
  const [ownerId, setOwnerId] = useState("all");
  const [selected, setSelected] = useState<Task>();
  const visible = tasks.filter((task) => (workspaceId === "all" || task.workspaceId === workspaceId) && (ownerId === "all" || task.ownerId === ownerId));
  const first = startOfMonth(new Date(2026, 7, 1));
  const days = eachDayOfInterval({ start: first, end: addDays(endOfMonth(first), 4) });
  return <div className="space-y-5"><div className="hero"><div><span className="eyebrow">DEADLINE & MỐC TRIỂN KHAI</span><h1>Lịch công việc</h1><p className="sub">Theo dõi deadline Task, ngày bắt đầu Plan và công việc của team.</p></div><div className="flex gap-2">{(["Tháng", "Tuần", "Agenda"] as const).map((item) => <button key={item} className={mode === item ? "btn" : "control"} onClick={() => setMode(item)}>{item}</button>)}</div></div><div className="toolbar"><select className="control" value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}><option value="all">Tất cả Workspace</option>{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="control" value={ownerId} onChange={(event) => setOwnerId(event.target.value)}><option value="all">Tất cả người phụ trách</option>{users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>{mode === "Agenda" ? <section className="card">{visible.sort((a,b) => a.deadline.localeCompare(b.deadline)).map((task) => <button className="flex w-full items-center justify-between border-b py-3 text-left" key={task.id} onClick={() => setSelected(task)}><div><b className="text-sm">{task.name}</b><p className="text-xs text-slate-500">{task.code} · {task.deadline} · {users.find(u => u.id === task.ownerId)?.name}</p></div><span className={`rounded px-2 py-1 text-xs ${statusStyle[task.status]}`}>{task.status}</span></button>)}</section> : <section className="card"><h2>{format(first, "MMMM yyyy", { locale: vi })}</h2><div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-slate-200">{["T2","T3","T4","T5","T6","T7","CN"].map((day) => <b className="bg-slate-50 p-2 text-center text-xs" key={day}>{day}</b>)}{days.map((day) => <div className="min-h-28 bg-white p-2" key={day.toISOString()}><span className="text-xs text-slate-500">{format(day, "d")}</span>{visible.filter((task) => task.deadline === format(day, "yyyy-MM-dd")).slice(0,2).map((task) => <button title={task.name} onClick={() => setSelected(task)} className={`mt-1 block w-full truncate rounded px-1.5 py-1 text-left text-[10px] font-medium ${statusStyle[task.status]}`} key={task.id}>{task.name}</button>)}</div>)}</div></section>}{selected && <TaskDetailDrawer task={selected} onClose={() => setSelected(undefined)}/>}</div>;
}
