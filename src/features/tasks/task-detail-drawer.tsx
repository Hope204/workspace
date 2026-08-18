"use client";

import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { users } from "@/lib/mock-data/data";
import { statusStyle } from "@/lib/status";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useState } from "react";
import type { Task, TaskStatus } from "@/types/domain";

function getAutoProgress(status: TaskStatus, current = 0): number {
  switch (status) {
    case "Chưa thực hiện":
      return 0;
    case "Đang thực hiện":
      return current > 0 && current < 100 ? current : 50;
    case "Cần hỗ trợ":
      return current > 0 ? current : 50;
    case "Hoàn thành":
      return 100;
    default:
      return current;
  }
}

export function TaskDetailDrawer({ task, onClose, progressOnly = false }: { task: Task; onClose: () => void; progressOnly?: boolean }) {
  const plans = useWorkspaceStore((state) => state.plans);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const updateTask = useWorkspaceStore((state) => state.updateTask);
  const deleteTask = useWorkspaceStore((state) => state.deleteTask);

  const [checklist, setChecklist] = useState(() => Array.from({ length: Math.max(task.checklistTotal, 2) }, (_, index) => index < task.checklistDone));
  const [actualResult, setActualResult] = useState(task.actualResult ?? "");
  const [blockedReason, setBlockedReason] = useState(task.blockedReason ?? "");
  const [note, setNote] = useState(task.note ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [progress, setProgress] = useState<number>(() => getAutoProgress(task.status, task.progress));
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const plan = plans.find((item) => item.id === task.planId);
  const workspace = workspaces.find((item) => item.id === task.workspaceId);
  const assigner = users.find((item) => item.id === task.ownerId) ?? users[0];
  const assignee = users.find((item) => item.id === (task.assigneeId || task.collaboratorIds[0])) ?? users[1] ?? users[0];
  const completed = checklist.filter(Boolean).length;

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    const autoProg = getAutoProgress(newStatus, progress);
    setProgress(autoProg);
  };

  const toggleChecklist = (index: number) => {
    const next = checklist.map((item, itemIndex) => itemIndex === index ? !item : item);
    setChecklist(next);
    const nextDone = next.filter(Boolean).length;
    const checklistProgress = Math.round((nextDone / next.length) * 100);
    const nextProgress = status === "Hoàn thành" ? 100 : status === "Chưa thực hiện" ? 0 : Math.max(progress, checklistProgress);
    setProgress(nextProgress);
    updateTask(task.id, { checklistDone: nextDone, checklistTotal: next.length, progress: nextProgress });
    toast.success("Đã cập nhật checklist");
  };

  const approve = () => { updateTask(task.id, { status: "Hoàn thành", progress: 100 }); toast.success("Đã phê duyệt và hoàn thành Task"); onClose(); };
  const reject = () => { updateTask(task.id, { status: "Làm lại" }); toast.success("Đã từ chối nghiệm thu và yêu cầu làm lại"); onClose(); };

  const saveUpdate = () => {
    const finalProgress = getAutoProgress(status, progress);
    updateTask(task.id, { actualResult, blockedReason: blockedReason || undefined, note, status, progress: finalProgress });
    toast.success(`Đã cập nhật trạng thái (${status}) & tự động tính tiến độ (${finalProgress}%)`);
    onClose();
  };

  const saveStatusOnly = () => {
    const finalProgress = getAutoProgress(status, progress);
    updateTask(task.id, { status, progress: finalProgress });
    toast.success(`Đã cập nhật trạng thái (${status}) & tự động tính tiến độ (${finalProgress}%)`);
    onClose();
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast.success("Đã xóa công việc thành công");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa công việc");
    }
  };

  if (progressOnly) {
    return (
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-card">
          <div className="flex justify-between">
            <div>
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusStyle[task.status]}`}>{task.status}</span>
              <h2 className="mt-3">{task.name}</h2>
              <p className="sub">{task.code}</p>
            </div>
            <button onClick={onClose} aria-label="Đóng"><X/></button>
          </div>

          <section className="mt-6 grid grid-cols-2 gap-4 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p><span className="text-slate-500">Người giao việc</span><br/><b className="text-blue-700">{assigner.name}</b></p>
            <p><span className="text-slate-500">Người thực hiện</span><br/><b className="text-emerald-700">{assignee.name}</b></p>
          </section>

          <section className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold">Cập nhật trạng thái</h3>
            <label className="mt-3 block text-sm">Trạng thái công việc
              <select className="field mt-1" value={status} onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}>
                <option value="Chưa thực hiện">Chưa thực hiện (0%)</option>
                <option value="Đang thực hiện">Đang thực hiện (50%)</option>
                <option value="Cần hỗ trợ">Cần hỗ trợ (50%)</option>
                <option value="Hoàn thành">Hoàn thành (100%)</option>
              </select>
            </label>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 p-3 text-sm">
              <span className="text-slate-600">Tiến độ tự động theo trạng thái:</span>
              <b className="text-blue-700 text-base">{progress}%</b>
            </div>
            <button className="btn mt-4 w-full" onClick={saveStatusOnly}>Lưu trạng thái công việc</button>
          </section>
        </div>
      </aside>
    );
  }

  return (
    <aside className="drawer" role="dialog" aria-modal="true">
      <div className="drawer-card">
        <div className="flex justify-between">
          <div>
            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusStyle[task.status]}`}>{task.status}</span>
            <h2 className="mt-3">{task.name}</h2>
            <p className="sub">{task.code}</p>
          </div>
          <button onClick={onClose} aria-label="Đóng"><X/></button>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-4 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
          <p><span className="text-slate-500">Workspace</span><br/><b>{workspace?.name ?? "—"}</b></p>
          <p><span className="text-slate-500">Kế hoạch</span><br/><b>{plan?.name ?? "—"}</b></p>
          <p><span className="text-slate-500">Người giao việc</span><br/><b className="text-blue-700">{assigner.name}</b></p>
          <p><span className="text-slate-500">Người thực hiện</span><br/><b className="text-emerald-700">{assignee.name}</b></p>
          <p className="col-span-2"><span className="text-slate-500">Deadline</span><br/><b>{task.deadline}</b></p>
        </section>

        <section className="mt-6 border-t pt-4">
          <h3 className="text-sm font-semibold">Trạng thái & Tiến độ</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 items-center">
            <label className="text-sm">Trạng thái
              <select className="field mt-1" value={status} onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}>
                <option value="Chưa thực hiện">Chưa thực hiện</option>
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Cần hỗ trợ">Cần hỗ trợ</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
            </label>
            <div className="text-sm">
              <span className="text-slate-500 block">Tiến độ hệ thống</span>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}/>
                </div>
                <span className="font-bold text-blue-700 text-sm">{progress}%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 border-t pt-4">
          <div className="flex justify-between">
            <h3 className="text-sm font-semibold">Checklist bắt buộc</h3>
            <span className="text-sm font-semibold text-blue-700">{completed}/{checklist.length}</span>
          </div>
          {checklist.map((isDone, index) => (
            <label className="mt-3 flex items-center gap-2 rounded border p-2 text-sm" key={index}>
              <input type="checkbox" checked={isDone} onChange={() => toggleChecklist(index)}/>
              {task.checklistItems?.[index] ?? (index === 0 ? "Rà soát dữ liệu đầu vào" : "Xác nhận kết quả với đơn vị liên quan")}
            </label>
          ))}
        </section>

        <section className="mt-6 border-t pt-4">
          <h3 className="text-sm font-semibold">Kết quả, vướng mắc & ghi chú</h3>
          <label className="mt-3 block text-sm">Kết quả thực tế
            <textarea className="field" rows={3} value={actualResult} onChange={(e) => setActualResult(e.target.value)} placeholder="Cập nhật kết quả đã thực hiện..."/>
          </label>
          <label className="mt-3 block text-sm">Vướng mắc / Cần hỗ trợ
            <textarea className="field" rows={2} value={blockedReason} onChange={(e) => setBlockedReason(e.target.value)} placeholder="Nêu nguyên nhân vướng mắc hoặc thông tin cần hỗ trợ..."/>
          </label>
          <label className="mt-3 block text-sm">Ghi chú
            <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú trao đổi, đề xuất..."/>
          </label>
          <button className="btn mt-3 w-full" onClick={saveUpdate}>Lưu cập nhật</button>
        </section>

        {task.status === "Chờ duyệt" && (
          <div className="mt-6 flex gap-2 border-t pt-4">
            <button className="btn flex-1" onClick={approve}>Phê duyệt hoàn thành</button>
            <button className="danger flex-1" onClick={reject}>Từ chối / Làm lại</button>
          </div>
        )}

        <section className="mt-6 border-t pt-4 flex justify-between items-center">
          {!showConfirmDelete ? (
            <button type="button" className="danger flex items-center gap-1 text-xs" onClick={() => setShowConfirmDelete(true)}>
              <Trash2 size={14}/> Xóa công việc
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full justify-between bg-red-50 p-2 rounded-lg border border-red-200">
              <span className="text-xs font-semibold text-red-700">Xác nhận xóa task này?</span>
              <div className="flex gap-2">
                <button type="button" className="control text-xs" onClick={() => setShowConfirmDelete(false)}>Hủy</button>
                <button type="button" className="danger text-xs" onClick={handleDelete}>Xóa vĩnh viễn</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
