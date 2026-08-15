"use client";

import { X } from "lucide-react";
import { toast } from "sonner";
import { users } from "@/lib/mock-data/data";
import { statusStyle } from "@/lib/status";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useState } from "react";
import type { Task } from "@/types/domain";

export function TaskDetailDrawer({ task, onClose }: { task: Task; onClose: () => void }) {
  const plans = useWorkspaceStore((state) => state.plans);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const updateTask = useWorkspaceStore((state) => state.updateTask);
  const [checklist, setChecklist] = useState(() => Array.from({ length: Math.max(task.checklistTotal, 2) }, (_, index) => index < task.checklistDone));
  const [actualResult, setActualResult] = useState(task.actualResult ?? "");
  const [blockedReason, setBlockedReason] = useState(task.blockedReason ?? "");
  const [note, setNote] = useState(task.note ?? "");
  const plan = plans.find((item) => item.id === task.planId);
  const workspace = workspaces.find((item) => item.id === task.workspaceId);
  const owner = users.find((item) => item.id === task.ownerId);
  const completed = checklist.filter(Boolean).length;
  const toggleChecklist = (index: number) => { const next = checklist.map((item, itemIndex) => itemIndex === index ? !item : item); setChecklist(next); updateTask(task.id, { checklistDone: next.filter(Boolean).length, checklistTotal: next.length, progress: Math.max(task.progress, Math.round(next.filter(Boolean).length / next.length * 100)) }); toast.success("Đã cập nhật checklist"); };
  const approve = () => { updateTask(task.id, { status: "Hoàn thành", progress: 100 }); toast.success("Đã phê duyệt và hoàn thành Task"); onClose(); };
  const reject = () => { updateTask(task.id, { status: "Làm lại" }); toast.success("Đã từ chối nghiệm thu và yêu cầu làm lại"); onClose(); };
  const saveUpdate = () => { updateTask(task.id, { actualResult, blockedReason: blockedReason || undefined, note, status: blockedReason.trim() ? "Bị chặn" : task.status }); toast.success("Đã cập nhật kết quả và vướng mắc"); };
  return <aside className="drawer" role="dialog" aria-modal="true"><div className="drawer-card"><div className="flex justify-between"><div><span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusStyle[task.status]}`}>{task.status}</span><h2 className="mt-3">{task.name}</h2><p className="sub">{task.code}</p></div><button onClick={onClose} aria-label="Đóng"><X/></button></div><section className="mt-6 grid grid-cols-2 gap-4 text-sm"><p><span className="text-slate-500">Workspace</span><br/><b>{workspace?.name ?? "—"}</b></p><p><span className="text-slate-500">Kế hoạch</span><br/><b>{plan?.name ?? "—"}</b></p><p><span className="text-slate-500">Người phụ trách</span><br/><b>{owner?.name ?? "—"}</b></p><p><span className="text-slate-500">Deadline</span><br/><b>{task.deadline}</b></p></section><section className="mt-6 border-t pt-4"><div className="flex justify-between"><h3 className="text-sm font-semibold">Checklist bắt buộc</h3><span className="text-sm font-semibold text-blue-700">{completed}/{checklist.length}</span></div>{checklist.map((isDone, index) => <label className="mt-3 flex items-center gap-2 rounded border p-2 text-sm" key={index}><input type="checkbox" checked={isDone} onChange={() => toggleChecklist(index)}/>{task.checklistItems?.[index] ?? (index === 0 ? "Rà soát dữ liệu đầu vào" : "Xác nhận kết quả với đơn vị liên quan")}</label>)}</section><section className="mt-6 border-t pt-4"><h3 className="text-sm font-semibold">Kết quả, vướng mắc & ghi chú</h3><label className="mt-3 block text-sm">Kết quả thực tế<textarea className="field" rows={3} value={actualResult} onChange={e=>setActualResult(e.target.value)} placeholder="Cập nhật kết quả đã thực hiện..."/></label><label className="mt-3 block text-sm">Vướng mắc<textarea className="field" rows={2} value={blockedReason} onChange={e=>setBlockedReason(e.target.value)} placeholder="Nêu vướng mắc nếu có..."/></label><label className="mt-3 block text-sm">Ghi chú<textarea className="field" rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Ghi chú trao đổi, đề xuất..."/></label><button className="btn mt-3" onClick={saveUpdate}>Lưu cập nhật</button></section>{task.status === "Chờ duyệt" && <div className="mt-6 flex gap-2 border-t pt-4"><button className="btn" onClick={approve}>Phê duyệt hoàn thành</button><button className="danger" onClick={reject}>Từ chối / Làm lại</button></div>}</div></aside>;
}
