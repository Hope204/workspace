"use client";
/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect, react-hooks/incompatible-library, @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unused-vars */
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3, Bell, CalendarDays, CheckCircle2, ChevronLeft, ClipboardList, FolderKanban, KanbanSquare, LayoutDashboard, Menu, Pencil, Plus, Search, Settings, Trash2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import { departments, users } from "@/lib/mock-data/data";
import { PlanWorkflowDialog } from "@/features/plans/plan-workflow-dialog";
import { TaskDetailDrawer } from "@/features/tasks/task-detail-drawer";
import { WorkspaceDetailDrawer } from "@/features/workspaces/workspace-detail-drawer";
import { WorkCalendar } from "@/features/calendar/work-calendar";
import { KpiDashboard } from "@/features/reports/kpi-dashboard";
import { priorityStyle, statusStyle } from "@/lib/status";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Plan, Priority, Task, TaskStatus, Workspace } from "@/types/domain";
import type { Role } from "@/lib/auth/roles";

type View = "Tổng quan" | "Workspace" | "Kế hoạch" | "Công việc của tôi" | "Quản lý công việc" | "Công việc team" | "Lịch công việc" | "Báo cáo/KPI";
const nav: [View, typeof LayoutDashboard][] = [["Tổng quan",LayoutDashboard],["Workspace",FolderKanban],["Kế hoạch",ClipboardList],["Công việc của tôi",CheckCircle2],["Quản lý công việc",Users],["Công việc team",KanbanSquare],["Lịch công việc",CalendarDays],["Báo cáo/KPI",BarChart3]];
const columns: TaskStatus[] = ["Chưa thực hiện","Đang thực hiện","Cần hỗ trợ","Hoàn thành"];
const priorities: Priority[] = ["Cao","Trung bình","Thấp"];
const Badge=({children,cls}:{children:React.ReactNode;cls:string})=><span className={`rounded-md px-2 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
function Avatar({id, label}:{id:string; label?: string}){const user=users.find(u=>u.id===id)??users[0];return <span title={label?`${label}: ${user.name}`:user.name} className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{user.initials}</span>}
function Modal({title,children,close}:{title:string;children:React.ReactNode;close:()=>void}){return <div className="overlay" role="dialog" aria-modal="true"><div className="dialog"><div className="flex items-start justify-between"><h2>{title}</h2><button onClick={close} aria-label="Đóng"><X size={19}/></button></div>{children}</div></div>}
function Confirm({title,onConfirm,close}:{title:string;onConfirm:()=>void;close:()=>void}){return <Modal title={title} close={close}><p className="sub">Dữ liệu liên quan sẽ bị xóa khỏi phiên làm việc này.</p><div className="flex justify-end gap-2"><button className="control" onClick={close}>Hủy</button><button className="danger" onClick={()=>{onConfirm();close()}}>Xóa vĩnh viễn</button></div></Modal>}

function ManagerTasksPage(){
  const tasks=useWorkspaceStore(s=>s.tasks),plans=useWorkspaceStore(s=>s.plans),spaces=useWorkspaceStore(s=>s.workspaces),removeTask=useWorkspaceStore(s=>s.deleteTask);
  const[detail,setDetail]=useState<Task|undefined>(),[delTask,setDelTask]=useState<Task|undefined>();
  const active=tasks.filter(t=>t.status!=="Hoàn thành"&&t.status!=="Đóng"&&t.status!=="Hủy");
  return <div className="space-y-5">
    <div><span className="eyebrow">OM / MANAGER</span><h1>Quản lý công việc</h1><p className="sub">Theo dõi tiến độ thành viên, kế hoạch và Workspace.</p></div>
    <div className="grid gap-3 md:grid-cols-3">
      <div className="card"><p className="sub">Task đang mở</p><b className="text-2xl">{active.length}</b></div>
      <div className="card"><p className="sub">Kế hoạch đang thực hiện</p><b className="text-2xl">{plans.filter(p=>p.status==="Đang thực hiện").length}</b></div>
      <div className="card"><p className="sub">Workspace hoạt động</p><b className="text-2xl">{spaces.filter(w=>w.status==="Hoạt động").length}</b></div>
    </div>
    <div className="card overflow-x-auto">
      <table>
        <thead>
          <tr>{["Mã Task","Công việc","Người giao việc","Người thực hiện","Kế hoạch / Workspace","Tiến độ","Trạng thái","Thao tác"].map(x=><th key={x}>{x}</th>)}</tr>
        </thead>
        <tbody>
          {active.map(t=><tr key={t.id}>
            <td className="font-semibold text-blue-700">{t.code}</td>
            <td><b>{t.name}</b><small className="block">Deadline {t.deadline}</small></td>
            <td><span className="font-medium text-slate-700">{users.find(u=>u.id===t.ownerId)?.name??"—"}</span></td>
            <td><span className="font-semibold text-emerald-700">{users.find(u=>u.id===(t.assigneeId||t.collaboratorIds[0]))?.name??"—"}</span></td>
            <td>{plans.find(p=>p.id===t.planId)?.name}<small className="block">{spaces.find(w=>w.id===t.workspaceId)?.name}</small></td>
            <td>{t.progress}%</td>
            <td><Badge cls={statusStyle[t.status]}>{t.status}</Badge></td>
            <td>
              <div className="flex items-center gap-1">
                <button className="control" onClick={()=>setDetail(t)}>Xem</button>
                <button aria-label="Xóa Task" title="Xóa công việc" className="icon text-red-600" onClick={()=>setDelTask(t)}><Trash2 size={15}/></button>
              </div>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {detail&&<TaskDetailDrawer task={detail} onClose={()=>setDetail(undefined)}/>}
    {delTask&&<Confirm title={`Xóa ${delTask.name}?`} close={()=>setDelTask(undefined)} onConfirm={()=>{removeTask(delTask.id);toast.success("Đã xóa công việc thành công")}}/>}
  </div>
}

const workspaceSchema=z.object({name:z.string().min(3,"Tên Workspace tối thiểu 3 ký tự"),description:z.string().min(8,"Mô tả tối thiểu 8 ký tự"),type:z.string().min(1),departmentIds:z.array(z.string()).min(1,"Chọn ít nhất một phòng ban"),ownerId:z.string().min(1),memberIds:z.array(z.string()).min(1,"Chọn ít nhất một thành viên")});
type WorkspaceForm=z.infer<typeof workspaceSchema>;
function WorkspaceFormDialog({item,close}:{item?:Workspace;close:()=>void}){const create=useWorkspaceStore(s=>s.createWorkspace),update=useWorkspaceStore(s=>s.updateWorkspace);const defaultOwnerId=item?.ownerId??users[0]?.id??"20000000-0000-4000-8000-000000000001";const f=useForm<WorkspaceForm>({resolver:zodResolver(workspaceSchema),defaultValues:{name:item?.name??"",description:item?.description??"",type:item?.type??"Dự án",departmentIds:item?.departmentIds??[item?.departmentId??"d1"],ownerId:defaultOwnerId,memberIds:item?.memberIds??[defaultOwnerId]}});const memberIds=f.watch("memberIds"),ownerId=f.watch("ownerId"),departmentIds=f.watch("departmentIds"),workspaceType=f.watch("type");const departmentUsers=users.filter(u=>departmentIds.includes(u.departmentId));const toggle=(id:string)=>{const next=memberIds.includes(id)?memberIds.filter(x=>x!==id):[...memberIds,id];f.setValue("memberIds",id===ownerId&&next.length===0?[id]:next)};const selectAll=()=>f.setValue("memberIds",Array.from(new Set([...memberIds,...departmentUsers.map(u=>u.id),ownerId])));const changeDepartments=(ids:string[])=>{f.setValue("departmentIds",ids);const first=users.find(u=>ids.includes(u.departmentId));if(first){f.setValue("ownerId",first.id);f.setValue("memberIds",[first.id])}};const submit=async (v:WorkspaceForm)=>{const memberIds=Array.from(new Set([...v.memberIds,v.ownerId]));const value={...v,memberIds};try{item?await update(item.id,value):await create(value);toast.success(item?"Đã cập nhật Workspace":"Đã tạo Workspace mới");close()}catch(err){toast.error(err instanceof Error?err.message:"Không thể lưu Workspace")}};return <Modal title={item?"Chỉnh sửa Workspace":"Tạo Workspace mới"} close={close}><form className="grid gap-4" onSubmit={f.handleSubmit(submit)}><label>Tên Workspace<input autoFocus className="field" {...f.register("name")}/><small>{f.formState.errors.name?.message}</small></label><label>Mô tả<textarea className="field" rows={3} {...f.register("description")}/><small>{f.formState.errors.description?.message}</small></label><div className="grid grid-cols-2 gap-3"><label>Loại Workspace<select className="field" {...f.register("type")}><option>Dự án</option><option>Phòng ban</option><option>Chương trình</option></select></label><label>{workspaceType==="Phòng ban"?"Phòng ban":"Phòng ban tham gia"}{workspaceType==="Phòng ban"?<select className="field" value={departmentIds[0]} onChange={e=>changeDepartments([e.target.value])}>{departments.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select>:<select multiple className="field member-departments" value={departmentIds} onChange={e=>changeDepartments(Array.from(e.target.selectedOptions,o=>o.value))}>{departments.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select>}<small>{f.formState.errors.departmentIds?.message}</small></label></div><label>Workspace Owner<select className="field" value={ownerId} onChange={e=>{f.setValue("ownerId",e.target.value);if(!memberIds.includes(e.target.value))f.setValue("memberIds",[...memberIds,e.target.value])}}>{departmentUsers.map(u=><option value={u.id} key={u.id}>{u.name} · {u.role}</option>)}</select></label><fieldset><div className="flex items-center justify-between"><legend className="text-sm font-medium">Nhân viên phòng ban</legend><button type="button" onClick={selectAll} className="text-xs font-semibold text-blue-700">Chọn tất cả</button></div><p className="mt-1 text-xs text-slate-500">{workspaceType==="Phòng ban"?"Nhân sự của phòng ban đã chọn.":"Nhân sự tổng hợp từ các phòng ban tham gia dự án/chương trình."}</p><div className="member-grid mt-3">{departmentUsers.map(u=><label className="member-option" key={u.id}><input type="checkbox" checked={memberIds.includes(u.id)} onChange={()=>toggle(u.id)}/><Avatar id={u.id}/><span>{u.name}<small className="block">{u.role}</small></span></label>)}</div><small>{f.formState.errors.memberIds?.message}</small></fieldset><div className="flex justify-end gap-2"><button type="button" className="control" onClick={close}>Hủy</button><button className="btn">{item?"Lưu thay đổi":"Tạo Workspace"}</button></div></form></Modal>}
function WorkspacePage(){const items=useWorkspaceStore(s=>s.workspaces),remove=useWorkspaceStore(s=>s.deleteWorkspace);const[q,setQ]=useState(""),[edit,setEdit]=useState<Workspace|undefined>(),[del,setDel]=useState<Workspace|undefined>(),[create,setCreate]=useState(false),[detail,setDetail]=useState<Workspace|undefined>();const shown=items.filter(x=>`${x.name} ${x.code}`.toLowerCase().includes(q.toLowerCase()));return <div className="space-y-5"><div className="hero"><div><span className="eyebrow">QUẢN LÝ KHÔNG GIAN LÀM VIỆC</span><h1>Workspace</h1><p className="sub">Tổ chức công việc theo phòng ban, dự án và chương trình triển khai.</p></div><button className="btn shadow-blue" onClick={()=>setCreate(true)}><Plus size={16}/>Tạo Workspace</button></div><div className="toolbar"><div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm theo tên hoặc mã..."/></div><select className="control"><option>Tất cả loại</option><option>Dự án</option><option>Phòng ban</option></select></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map(w=><article className="card workspace-card" key={w.id}><div className="flex justify-between"><Badge cls="bg-blue-50 text-blue-700">{w.code}</Badge><div className="flex gap-1"><button className="icon text-blue-700" onClick={()=>setDetail(w)}>Xem</button><button aria-label="Sửa" onClick={()=>setEdit(w)} className="icon"><Pencil size={15}/></button><button aria-label="Xóa" onClick={()=>setDel(w)} className="icon text-red-600"><Trash2 size={15}/></button></div></div><h2 className="mt-4">{w.name}</h2><p className="sub mt-1">{w.description}</p><div className="mt-5 flex items-center gap-1">{w.memberIds.slice(0,4).map(id=><Avatar key={id} id={id}/>)}<span className="ml-2 text-xs text-slate-500">{w.memberIds.length} thành viên</span></div><div className="mt-5 flex justify-between text-xs"><span className="text-slate-500">Tiến độ thực hiện</span><b>{w.progress}%</b></div><div className="mt-2 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-blue-600" style={{width:`${w.progress}%`}}/></div><div className="mt-5 flex justify-between border-t pt-3 text-xs text-slate-500"><span>{w.planCount} kế hoạch</span><span>{w.openTasks} việc đang mở</span></div></article>)}</div>{detail&&<WorkspaceDetailDrawer workspace={detail} onClose={()=>setDetail(undefined)}/>} {create&&<WorkspaceFormDialog close={()=>setCreate(false)}/>} {edit&&<WorkspaceFormDialog item={edit} close={()=>setEdit(undefined)}/>} {del&&<Confirm title={`Xóa ${del.name}?`} close={()=>setDel(undefined)} onConfirm={()=>{remove(del.id);toast.success("Đã xóa Workspace")}}/>}</div>}

const planSchema=z.object({name:z.string().min(5,"Tên kế hoạch tối thiểu 5 ký tự"),workspaceId:z.string().min(1,"Chọn Workspace"),startDate:z.string(),deadline:z.string(),priority:z.enum(["Cao","Trung bình","Thấp"])}).refine(v=>v.deadline>=v.startDate,{path:["deadline"],message:"Deadline không được nhỏ hơn ngày bắt đầu"});
type PlanForm=z.infer<typeof planSchema>;
function PlanFormDialog({item,close}:{item?:Plan;close:()=>void}){const spaces=useWorkspaceStore(s=>s.workspaces),create=useWorkspaceStore(s=>s.createPlan),update=useWorkspaceStore(s=>s.updatePlan);const f=useForm<PlanForm>({resolver:zodResolver(planSchema),defaultValues:{name:item?.name??"",workspaceId:item?.workspaceId??spaces[0]?.id??"",startDate:item?.startDate??"2026-08-15",deadline:item?.deadline??"",priority:item?.priority??"Trung bình"}});return <Modal title={item?"Chỉnh sửa kế hoạch":"Tạo kế hoạch"} close={close}><form className="grid gap-4" onSubmit={f.handleSubmit(v=>{item?update(item.id,v):create(v);toast.success(item?"Đã cập nhật kế hoạch":"Đã tạo kế hoạch nháp");close()})}><label>Tên kế hoạch<input className="field" {...f.register("name")}/><small>{f.formState.errors.name?.message}</small></label><label>Workspace<select className="field" {...f.register("workspaceId")}>{spaces.map(w=><option value={w.id} key={w.id}>{w.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label>Ngày bắt đầu<input type="date" className="field" {...f.register("startDate")}/></label><label>Deadline<input type="date" className="field" {...f.register("deadline")}/><small>{f.formState.errors.deadline?.message}</small></label></div><label>Ưu tiên<select className="field" {...f.register("priority")}>{priorities.map(x=><option key={x}>{x}</option>)}</select></label><div className="flex justify-end gap-2"><button type="button" className="control" onClick={close}>Hủy</button><button className="btn">Lưu kế hoạch</button></div></form></Modal>}
function PlansPage(){const items=useWorkspaceStore(s=>s.plans),spaces=useWorkspaceStore(s=>s.workspaces),remove=useWorkspaceStore(s=>s.deletePlan);const[q,setQ]=useState(""),[create,setCreate]=useState(false),[edit,setEdit]=useState<Plan|undefined>(),[del,setDel]=useState<Plan|undefined>(),[workflow,setWorkflow]=useState<Plan|undefined>();const rows=items.filter(x=>x.name.toLowerCase().includes(q.toLowerCase()));return <div className="space-y-5"><div className="hero"><div><span className="eyebrow">LẬP KẾ HOẠCH & THEO DÕI</span><h1>Kế hoạch</h1><p className="sub">Quản lý tiến độ, deadline và người phụ trách của từng kế hoạch.</p></div><button className="btn shadow-blue" onClick={()=>setCreate(true)}><Plus size={16}/>Tạo kế hoạch</button></div><div className="card overflow-x-auto"><div className="mb-4 flex justify-between gap-3"><div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm kế hoạch..."/></div><button className="control" onClick={()=>toast.success("Đã xuất dữ liệu giả lập")}>Xuất dữ liệu</button></div><table><thead><tr>{["Mã","Tên kế hoạch","Workspace","Deadline","Tiến độ","Trạng thái","Ưu tiên",""].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(p=><tr key={p.id}><td className="font-semibold text-blue-700">{p.code}</td><td><b>{p.name}</b><small className="block">{p.parentId?"Kế hoạch con":"Kế hoạch gốc"}</small></td><td>{spaces.find(w=>w.id===p.workspaceId)?.name??"—"}</td><td>{p.deadline}</td><td>{p.progress}%</td><td><Badge cls={statusStyle[p.status]}>{p.status}</Badge></td><td><Badge cls={priorityStyle[p.priority]}>{p.priority}</Badge></td><td><div className="flex gap-2"><button className="icon text-blue-700" title="Workflow" onClick={()=>setWorkflow(p)}>↗</button><button className="icon" onClick={()=>setEdit(p)}><Pencil size={15}/></button><button className="icon text-red-600" onClick={()=>setDel(p)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>{create&&<PlanFormDialog close={()=>setCreate(false)}/>} {edit&&<PlanFormDialog item={edit} close={()=>setEdit(undefined)}/>} {workflow&&<PlanWorkflowDialog plan={workflow} onClose={()=>setWorkflow(undefined)}/>} {del&&<Confirm title={`Xóa ${del.name}?`} close={()=>setDel(undefined)} onConfirm={()=>{remove(del.id);toast.success("Đã xóa kế hoạch")}}/>}</div>}

function TaskCard({task,open,onDelete}:{task:Task;open:()=>void;onDelete?:()=>void}){
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const assigneeId = task.assigneeId || task.collaboratorIds[0] || task.ownerId;
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 1,
    touchAction: "none",
  };
  return <div ref={setNodeRef} {...listeners} {...attributes} onDoubleClick={open} style={style} className={`task relative group cursor-grab active:cursor-grabbing transition-all ${isDragging?"shadow-xl ring-2 ring-blue-500 bg-blue-50/50 scale-[1.02]":""}`}>
    <div className="flex justify-between items-center"><small className="font-semibold text-blue-700">{task.code}</small>
      <div className="flex items-center gap-1">
        <Badge cls={priorityStyle[task.priority]}>{task.priority}</Badge>
        {onDelete && <span title="Xóa task" onClick={(e)=>{e.stopPropagation();onDelete();}} className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"><Trash2 size={13}/></span>}
      </div>
    </div>
    <b className="mt-2 block text-sm text-left">{task.name}</b>
    {task.blockedReason&&<small className="mt-2 block text-red-600">● {task.blockedReason}</small>}
    <div className="mt-3 flex items-center justify-between">
      <small>{task.deadline} · {task.progress}%</small>
      <div className="flex items-center gap-1">
        <Avatar id={task.ownerId} label="Người giao việc"/>
        <Avatar id={assigneeId} label="Người thực hiện"/>
      </div>
    </div>
  </div>
}

function Column({name,children}:{name:TaskStatus;children:React.ReactNode}){
  const d=useDroppable({id:name});
  return <section ref={d.setNodeRef} className={`kanban-col ${d.isOver?"bg-blue-50":""}`}>
    <Badge cls={statusStyle[name]}>{name}</Badge>
    <div className="mt-3 space-y-3">{children}</div>
  </section>
}

function TaskFormDialog({task,close}:{task?:Task;close:()=>void}){
  const plans=useWorkspaceStore(s=>s.plans),create=useWorkspaceStore(s=>s.createTask),update=useWorkspaceStore(s=>s.updateTask),removeTask=useWorkspaceStore(s=>s.deleteTask);
  const defaultOwnerId=task?.ownerId??users[0]?.id??"20000000-0000-4000-8000-000000000001";
  const defaultAssigneeId=task?.assigneeId??users[1]?.id??"20000000-0000-4000-8000-000000000003";
  const [name,setName]=useState(task?.name??""),[planId,setPlanId]=useState(task?.planId??plans[0]?.id??"");
  const [ownerId,setOwnerId]=useState(defaultOwnerId),[assigneeId,setAssigneeId]=useState(defaultAssigneeId);
  const [collaboratorIds,setCollaboratorIds]=useState<string[]>(()=>Array.from(new Set([defaultAssigneeId,...(task?.collaboratorIds??[])])));
  const [deadline,setDeadline]=useState(task?.deadline??"2026-08-30"),[priority,setPriority]=useState<Priority>(task?.priority??"Trung bình");
  const [note,setNote]=useState(task?.note??""),[checklistText,setChecklistText]=useState(task?.checklistItems?.join("\n")??""),[attachmentNames,setAttachmentNames]=useState(task?.attachmentNames?.join(", ")??"");
  const [confirmDelete,setConfirmDelete]=useState(false);

  const changeAssignee=(userId:string)=>{
    setAssigneeId(userId);
    setCollaboratorIds(current=>Array.from(new Set([userId,...current])));
  };

  async function save(){
    if(name.trim().length<3){toast.error("Tên Task tối thiểu 3 ký tự");return}
    const plan=plans.find(p=>p.id===planId);
    if(!plan){toast.error("Hãy tạo kế hoạch trước khi thêm Task");return}
    const checklistItems=checklistText.split("\n").map(x=>x.trim()).filter(Boolean);
    const value={
      name,planId,workspaceId:plan.workspaceId,
      ownerId,assigneeId,
      collaboratorIds:Array.from(new Set([assigneeId,...collaboratorIds])),
      deadline,priority,note,checklistItems,checklistTotal:checklistItems.length,checklistDone:0,
      attachmentNames:attachmentNames.split(",").map(x=>x.trim()).filter(Boolean),
      files:attachmentNames.split(",").map(x=>x.trim()).filter(Boolean).length
    };
    try{
      task?await update(task.id,value):await create(value);
      toast.success(task?"Đã cập nhật và phân công Task":"Đã tạo và phân công Task");
      close();
    }catch(err){toast.error(err instanceof Error?err.message:"Không thể lưu và phân công Task")}
  }

  async function handleDelete(){
    if(!task) return;
    try{
      await removeTask(task.id);
      toast.success("Đã xóa công việc thành công");
      close();
    }catch(err){toast.error(err instanceof Error?err.message:"Không thể xóa Task")}
  }

  return <Modal title={task?"Chỉnh sửa & phân công Task":"Tạo & phân công Task"} close={close}>
    <div className="grid gap-4">
      <label>Tên công việc<input autoFocus className="field" value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>Kế hoạch<select className="field" value={planId} onChange={e=>setPlanId(e.target.value)}>{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3">
        <label>Người giao việc (Assigner)<select className="field" value={ownerId} onChange={e=>setOwnerId(e.target.value)}>{users.map(u=><option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}</select></label>
        <label>Người thực hiện chính (Assignee)<select className="field" value={assigneeId} onChange={e=>changeAssignee(e.target.value)}>{users.map(u=><option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}</select></label>
      </div>
      <fieldset><legend className="text-sm font-medium">Thành viên phối hợp khác</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">{users.map(user=><label className="flex items-center gap-2 rounded border p-2 text-sm" key={user.id}><input type="checkbox" checked={collaboratorIds.includes(user.id)} onChange={()=>{setCollaboratorIds(cur=>cur.includes(user.id)?cur.filter(x=>x!==user.id):[...cur,user.id])}}/><Avatar id={user.id}/><span>{user.name}<small className="block">{user.role}</small></span></label>)}</div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <label>Deadline<input className="field" type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label>
        <label>Ưu tiên<select className="field" value={priority} onChange={e=>setPriority(e.target.value as Priority)}>{priorities.map(x=><option key={x}>{x}</option>)}</select></label>
      </div>
      <label>Checklist (mỗi dòng một mục)<textarea className="field" rows={3} value={checklistText} onChange={e=>setChecklistText(e.target.value)} placeholder="Rà soát dữ liệu&#10;Xác nhận kết quả"/></label>
      <label>Ghi chú<textarea className="field" rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Ghi chú giao việc..."/></label>
      <label>Tài liệu đính kèm (tên file, ngăn cách bằng dấu phẩy)<input className="field" value={attachmentNames} onChange={e=>setAttachmentNames(e.target.value)} placeholder="BRD.pdf, KeHoach.xlsx"/></label>
      <div className="flex justify-between items-center pt-2">
        {task ? (
          !confirmDelete ? (
            <button type="button" className="danger flex items-center gap-1 text-xs" onClick={()=>setConfirmDelete(true)}><Trash2 size={14}/> Xóa Task</button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-700 font-semibold">Xóa vĩnh viễn?</span>
              <button type="button" className="control text-xs" onClick={()=>setConfirmDelete(false)}>Hủy</button>
              <button type="button" className="danger text-xs" onClick={handleDelete}>Xác nhận</button>
            </div>
          )
        ) : <div/>}
        <div className="flex justify-end gap-2">
          <button type="button" className="control" onClick={close}>Hủy</button>
          <button type="button" className="btn" onClick={save}>{task?"Lưu thay đổi":"Tạo Task"}</button>
        </div>
      </div>
    </div>
  </Modal>
}

function Kanban({currentUser}:{currentUser:AuthenticatedUser}){
  const tasks=useWorkspaceStore(s=>s.tasks),update=useWorkspaceStore(s=>s.updateTask),removeTask=useWorkspaceStore(s=>s.deleteTask);
  const canCreate=currentUser.role==="OM"||currentUser.role==="Manager";
  const[ready,setReady]=useState(false),[create,setCreate]=useState(false),[edit,setEdit]=useState<Task|undefined>(),[viewDetail,setViewDetail]=useState<Task|undefined>(),[del,setDel]=useState<Task|undefined>();
  useEffect(()=>setReady(true),[]);
  const board=<div className="flex gap-4 overflow-x-auto">{columns.map(status=><Column name={status} key={status}>
    <div className="flex justify-between text-xs text-slate-500">
      <span>{tasks.filter(t=>t.status===status).length} công việc</span>
      {status==="Chưa thực hiện"&&canCreate&&<button className="text-blue-700 font-semibold" onClick={()=>setCreate(true)}>+ Thêm</button>}
    </div>
    {tasks.filter(t=>t.status===status).map(t=>ready?<TaskCard key={t.id} task={t} open={()=>canCreate?setEdit(t):setViewDetail(t)} onDelete={canCreate?()=>setDel(t):undefined}/>:<div className="task" key={t.id}>{t.name}</div>)}
  </Column>)}</div>;

  async function end(e:DragEndEvent){
    const nextStatus=e.over?.id as TaskStatus;
    if(columns.includes(nextStatus)){
      const taskId=String(e.active.id);
      const target=tasks.find(t=>t.id===taskId);
      if(!target) return;
      const nextProgress = nextStatus === "Hoàn thành" ? 100 : nextStatus === "Chưa thực hiện" ? 0 : Math.max(target.progress, 30);
      try {
        await update(taskId, {
          status: nextStatus,
          progress: nextProgress,
          actualResult: nextStatus === "Hoàn thành" ? (target.actualResult || "Đã hoàn thành công việc theo kế hoạch.") : target.actualResult,
          blockedReason: nextStatus === "Cần hỗ trợ" ? (target.blockedReason || "Cần hỗ trợ xử lý vướng mắc.") : target.blockedReason,
        });
        toast.success(`Đã chuyển công việc sang "${nextStatus}"`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không thể chuyển trạng thái công việc");
      }
    }
  }

  return <div className="space-y-5">
    <div className="hero">
      <div>
        <span className="eyebrow">THEO DÕI THỰC THI</span>
        <h1>Kanban công việc</h1>
        <p className="sub">{canCreate?"Kéo thả Task giữa các trạng thái; nhấp đúp để chỉnh sửa và phân công.":"Kéo thả Task để cập nhật nhanh trạng thái và tiến độ xử lý."}</p>
      </div>
      {canCreate&&<button className="btn shadow-blue" onClick={()=>setCreate(true)}><Plus size={16}/>Tạo Task</button>}
    </div>
    {ready?<DndContext onDragEnd={end}>{board}</DndContext>:board}
    {create&&canCreate&&<TaskFormDialog close={()=>setCreate(false)}/>}
    {edit&&canCreate&&<TaskFormDialog task={edit} close={()=>setEdit(undefined)}/>}
    {viewDetail&&<TaskDetailDrawer task={viewDetail} progressOnly={currentUser.role === "User"} onClose={()=>setViewDetail(undefined)}/>}
    {del&&canCreate&&<Confirm title={`Xóa ${del.name}?`} close={()=>setDel(undefined)} onConfirm={()=>{removeTask(del.id);toast.success("Đã xóa công việc thành công")}}/>}
  </div>
}

function Overview(){
  const tasks=useWorkspaceStore(s=>s.tasks),plans=useWorkspaceStore(s=>s.plans);
  const metric=(title:string,value:number,note:string)=><button className="card text-left" onClick={()=>toast.info(`Đang lọc ${title}`)}><p className="text-sm text-slate-500">{title}</p><b className="mt-2 block text-2xl">{value}</b><p className="mt-2 text-xs text-blue-600">{note}</p></button>;
  return <div className="space-y-5">
    <div><span className="eyebrow">ERP & AI PLATFORM</span><h1>Tổng quan công việc</h1><p className="sub">Tình hình kế hoạch, phân công và tiến độ xử lý hôm nay.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {metric("Kế hoạch thực hiện",plans.filter(p=>p.status==="Đang thực hiện").length,"Đang theo dõi")}
      {metric("Tổng công việc",tasks.length,"Toàn hệ thống")}
      {metric("Hoàn thành",tasks.filter(t=>t.status==="Hoàn thành").length,"Đã hoàn tất")}
      {metric("Đang thực hiện",tasks.filter(t=>t.status==="Đang thực hiện").length,"Đang xử lý")}
      {metric("Cần hỗ trợ",tasks.filter(t=>t.status==="Cần hỗ trợ"||t.status==="Bị chặn").length,"Có vướng mắc")}
      {metric("Quá hạn",tasks.filter(t=>t.deadline<"2026-08-15"&&t.status!=="Hoàn thành").length,"Cần ưu tiên")}
    </div>
    <section className="card">
      <h2>Việc cần xử lý sớm</h2>
      {tasks.slice(0,6).map(t=><div className="flex items-center justify-between border-b py-3" key={t.id}>
        <div><b className="text-sm">{t.name}</b><small className="block">{t.code} · Deadline {t.deadline}</small></div>
        <div className="flex items-center gap-1">
          <Avatar id={t.ownerId} label="Người giao việc"/>
          <Avatar id={t.assigneeId || t.collaboratorIds[0] || t.ownerId} label="Người thực hiện"/>
        </div>
      </div>)}
    </section>
  </div>
}

function Basic({title}:{title:string}){return <div><span className="eyebrow">BÁO CÁO VẬN HÀNH</span><h1>{title}</h1><p className="sub">Màn hình đang được chuẩn bị cho dữ liệu vận hành chi tiết.</p><div className="card mt-5"><p className="sub">Sử dụng Workspace, Kế hoạch và Kanban để bắt đầu quản lý công việc.</p></div></div>}

type AuthenticatedUser={id:string;name:string;role:Role};
function MyTasksPage({currentUser}:{currentUser:AuthenticatedUser}){
  const tasks=useWorkspaceStore(s=>s.tasks),removeTask=useWorkspaceStore(s=>s.deleteTask);
  const[detail,setDetail]=useState<Task|undefined>(),[delTask,setDelTask]=useState<Task|undefined>();
  const canDelete = currentUser.role === "OM" || currentUser.role === "Manager";
  const waiting=tasks.filter(t=>t.assigneeId===currentUser.id||t.collaboratorIds.includes(currentUser.id)||t.ownerId===currentUser.id);
  return <div className="space-y-5">
    <div>
      <span className="eyebrow">{currentUser.role === "OM" ? "OM / WORKSPACE OWNER" : currentUser.role === "Manager" ? "MANAGER" : "CÔNG VIỆC CÁ NHÂN"}</span>
      <h1>Công việc của tôi</h1>
      <p className="sub">Danh sách công việc giao cho và bởi {currentUser.name}.</p>
    </div>
    <div className="card overflow-x-auto">
      <table>
        <thead>
          <tr>{["Mã Task","Công việc","Người giao việc","Người thực hiện","Deadline","Tiến độ","Trạng thái","Thao tác"].map(x=><th key={x}>{x}</th>)}</tr>
        </thead>
        <tbody>
          {waiting.map(task=>{
            const assigner = users.find(u=>u.id===task.ownerId)?.name ?? "—";
            const assignee = users.find(u=>u.id===(task.assigneeId||task.collaboratorIds[0]))?.name ?? "—";
            return <tr key={task.id}>
              <td className="font-semibold text-blue-700">{task.code}</td>
              <td><b>{task.name}</b><small className="block">Checklist {task.checklistDone}/{task.checklistTotal}</small></td>
              <td><span className="font-medium text-slate-700">{assigner}</span></td>
              <td><span className="font-semibold text-emerald-700">{assignee}</span></td>
              <td>{task.deadline}</td>
              <td>{task.progress}%</td>
              <td><Badge cls={statusStyle[task.status]}>{task.status}</Badge></td>
              <td>
                <div className="flex items-center gap-1">
                  <button className="control" onClick={()=>setDetail(task)}>Cập nhật tiến độ</button>
                  {canDelete && <button aria-label="Xóa Task" title="Xóa công việc" className="icon text-red-600" onClick={()=>setDelTask(task)}><Trash2 size={15}/></button>}
                </div>
              </td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
    {detail&&<TaskDetailDrawer task={detail} progressOnly={currentUser.role === "User"} onClose={()=>setDetail(undefined)}/>}
    {delTask&&<Confirm title={`Xóa ${delTask.name}?`} close={()=>setDelTask(undefined)} onConfirm={()=>{removeTask(delTask.id);toast.success("Đã xóa công việc thành công")}}/>}
  </div>
}

export function WorkspaceApp({currentUser}:{currentUser:AuthenticatedUser}){
  const isOM=currentUser.role==="OM";
  const canCreateTasks=isOM||currentUser.role==="Manager";
  const availableNav=isOM?nav:canCreateTasks?nav.filter(([name])=>["Tổng quan","Công việc của tôi","Quản lý công việc","Công việc team","Lịch công việc"].includes(name)):nav.filter(([name])=>["Công việc của tôi","Công việc team","Lịch công việc"].includes(name));
  const[view,setView]=useState<View>(isOM?"Tổng quan":"Công việc của tôi"),[collapsed,setCollapsed]=useState(false);
  const content=view==="Tổng quan"?<Overview/>:view==="Workspace"?<WorkspacePage/>:view==="Kế hoạch"?<PlansPage/>:view==="Công việc của tôi"?<MyTasksPage currentUser={currentUser}/>:view==="Quản lý công việc"&&canCreateTasks?<ManagerTasksPage/>:view==="Công việc team"?<Kanban currentUser={currentUser}/>:view==="Lịch công việc"?<WorkCalendar/>:view==="Báo cáo/KPI"&&isOM?<KpiDashboard/>:<Basic title={view}/>;
  return <div className="min-h-screen bg-slate-50">
    <aside className={`sidebar ${collapsed?"mini":""}`}>
      <div className="brand"><span className="grid h-7 w-7 place-items-center rounded bg-blue-500 text-white">T</span>{!collapsed&&<b>THÀNH DANH WORKSPACE</b>}</div>
      {availableNav.map(([name,Icon])=><button title={name} className={view===name?"active":""} onClick={()=>setView(name)} key={name}><Icon size={18}/>{!collapsed&&name}</button>)}
      <button><Bell size={18}/>{!collapsed&&"Thông báo"}</button>
      {isOM&&<button><Settings size={18}/>{!collapsed&&"Quản trị"}</button>}
      <button className="collapse" onClick={()=>setCollapsed(v=>!v)}><ChevronLeft className={collapsed?"rotate-180":""}/></button>
    </aside>
    <main className={collapsed?"content mini-content":"content"}>
      <header>
        <span className="crumb"><Menu size={18}/>Workspace / <b>{view}</b></span>
        <div className="flex items-center gap-3">
          <div className="search top-search"><Search size={16}/><input placeholder="Tìm kiếm toàn hệ thống..."/></div>
          <div className="flex items-center gap-2">
            <Avatar id={currentUser.id}/>
            <span className="hidden text-right text-xs sm:block">
              <b className="block text-slate-700">{currentUser.name}</b>
              <span className="text-slate-500">{currentUser.role}</span>
            </span>
          </div>
        </div>
      </header>
      <div className="page">{content}</div>
    </main>
    <Toaster richColors position="top-right"/>
  </div>
}
