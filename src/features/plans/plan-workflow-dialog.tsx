"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Plan } from "@/types/domain";

export function PlanWorkflowDialog({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const transition = useWorkspaceStore((state) => state.transitionPlan);
  const activities = useWorkspaceStore((state) => state.activities).filter((item) => item.entityId === plan.id);
  const [note, setNote] = useState("");
  const run = (status: Plan["status"]) => {
    const result = transition(plan.id, status, note);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(`Đã chuyển kế hoạch sang “${status}”`);
    onClose();
  };
  return <div className="overlay" role="dialog" aria-modal="true"><div className="dialog"><div className="flex justify-between"><div><h2>Tiến độ & phê duyệt</h2><p className="sub">{plan.code} · {plan.name}</p></div><button onClick={onClose}>×</button></div><label className="block text-sm font-medium">Ghi chú / lý do<textarea className="field" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Bắt buộc khi tạm dừng hoặc từ chối..."/></label><div className="flex flex-wrap gap-2"><button className="btn" onClick={() => run("Chờ duyệt")}>Gửi duyệt</button><button className="btn" onClick={() => run("Đã duyệt")}>Phê duyệt</button><button className="control" onClick={() => run("Đang thực hiện")}>Bắt đầu thực hiện</button><button className="control" onClick={() => run("Chờ nghiệm thu")}>Gửi nghiệm thu</button><button className="btn" onClick={() => run("Hoàn thành")}>Hoàn thành</button><button className="danger" onClick={() => run("Từ chối")}>Từ chối</button><button className="danger" onClick={() => run("Tạm dừng")}>Tạm dừng</button><button className="control" onClick={() => run("Đóng")}>Đóng kế hoạch</button></div><section className="mt-4 border-t pt-3"><h3 className="text-sm font-semibold">Lịch sử gần đây</h3>{activities.length === 0 ? <p className="sub mt-2">Chưa có thao tác workflow.</p> : activities.slice(0,4).map((item) => <div className="mt-2 text-xs" key={item.id}><b>{item.action}</b><span className="ml-2 text-slate-500">{item.description}</span></div>)}</section></div></div>;
}
