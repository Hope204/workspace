"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { users } from "@/lib/mock-data/data";
import { statusStyle } from "@/lib/status";
import { useWorkspaceStore } from "@/stores/workspace-store";

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) { return <article className="card"><p className="text-sm text-slate-500">{label}</p><b className="mt-2 block text-2xl">{value}</b><p className="mt-2 text-xs text-blue-600">{note}</p></article>; }
export function KpiDashboard() {
  const tasks = useWorkspaceStore((state) => state.tasks);
  const plans = useWorkspaceStore((state) => state.plans);
  const completed = tasks.filter((task) => task.status === "Hoàn thành");
  const overdue = tasks.filter((task) => task.deadline < "2026-08-15" && task.status !== "Hoàn thành");
  const onTime = completed.filter((task) => task.deadline >= "2026-08-15").length;
  const chart = users.map((user) => ({ name: user.name.split(" ").at(-1), value: tasks.filter((task) => task.ownerId === user.id && task.status !== "Hoàn thành").length })).filter((item) => item.value > 0);
  return <div className="space-y-5"><div><span className="eyebrow">HIỆU QUẢ VẬN HÀNH</span><h1>Báo cáo & KPI</h1><p className="sub">Theo dõi kết quả thực hiện theo kế hoạch, thành viên và deadline.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Tỷ lệ hoàn thành" value={`${tasks.length ? Math.round(completed.length / tasks.length * 100) : 0}%`} note={`${completed.length}/${tasks.length} Task`}/><Metric label="Hoàn thành đúng hạn" value={`${completed.length ? Math.round(onTime / completed.length * 100) : 0}%`} note="Theo Task hoàn thành"/><Metric label="Task quá hạn" value={overdue.length} note="Cần ưu tiên xử lý"/><Metric label="Kế hoạch đang thực hiện" value={plans.filter((plan) => plan.status === "Đang thực hiện").length} note="Theo dõi tiến độ"/></div><div className="grid gap-5 xl:grid-cols-5"><section className="card xl:col-span-3"><h2>Workload theo thành viên</h2><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" fill="#2563eb" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section><section className="card xl:col-span-2"><h2>Cần lưu ý</h2>{tasks.filter((task) => task.status === "Bị chặn" || task.deadline < "2026-08-15").map((task) => <div className="flex justify-between border-b py-3 text-sm" key={task.id}><div><b>{task.name}</b><p className="text-xs text-slate-500">{users.find((user) => user.id === task.ownerId)?.name}</p></div><span className={`h-fit rounded px-2 py-1 text-xs ${statusStyle[task.status]}`}>{task.status}</span></div>)}</section></div></div>;
}
