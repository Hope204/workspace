"use client";

import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Role } from "@/lib/auth/roles";

export type DemoAccount = { id: string; username: string; password: string; name: string; role: Role; initials: string };

type LoginResponse = {
  data: {
    id: string;
    username: string;
    name: string;
    role: DemoAccount["role"];
  };
};

export const demoAccounts: DemoAccount[] = [
  { id: "20000000-0000-4000-8000-000000000001", username: "phuong.om", password: "OM@2026", name: "Lê Võ Mai Phương", role: "OM", initials: "MP" },
  { id: "20000000-0000-4000-8000-000000000003", username: "giang.ba", password: "User@2026", name: "Võ Thị Hương Giang", role: "User", initials: "HG" },
  { id: "20000000-0000-4000-8000-000000000004", username: "dao.qa", password: "User@2026", name: "Bùi Thị Hồng Đào", role: "User", initials: "HĐ" },
  { id: "20000000-0000-4000-8000-000000000005", username: "hieu.ai", password: "Manager@2026", name: "Trần Thanh Hiếu", role: "Manager", initials: "TH" },
];

export function LoginScreen({ onLogin }: { onLogin: (account: DemoAccount) => void }) {
  const [username, setUsername] = useState(demoAccounts[0].username);
  const [password, setPassword] = useState(demoAccounts[0].password);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username.trim(), password }) });
      if (!response.ok) { setError("Tài khoản hoặc mật khẩu không đúng."); return; }
      const { data } = await response.json() as LoginResponse;
      setError("");
      onLogin({ id: data.id, username: data.username, password: "", name: data.name, role: data.role, initials: data.name.split(/\s+/).map((part) => part[0]).slice(-2).join("").toUpperCase() || "US" });
    } catch { setError("Không thể kết nối dịch vụ đăng nhập."); }
  }

  return <main className="min-h-screen bg-slate-100 p-5 md:grid md:place-items-center"><section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 md:grid-cols-[1.05fr_.95fr]">
    <div className="bg-slate-950 p-8 text-white md:p-12"><div className="mb-14 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500 font-bold">T</span><b>THÀNH DANH WORKSPACE</b></div><span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200"><ShieldCheck size={14}/> Môi trường kiểm thử</span><h1 className="mt-5 max-w-md text-3xl font-bold leading-tight">Quản lý kế hoạch và công việc trên một không gian chung.</h1><p className="mt-3 max-w-md text-sm leading-6 text-slate-300">Đăng nhập bằng một trong các tài khoản mẫu bên dưới. Mật khẩu chỉ được hiển thị trong môi trường test.</p><div className="mt-8 space-y-3">{demoAccounts.map((account) => <button type="button" key={account.username} onClick={() => { setUsername(account.username); setPassword(account.password); setError(""); }} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-100">{account.initials}</span><span className="min-w-0 flex-1"><b className="block text-sm">{account.name}</b><span className="block truncate text-xs text-slate-400">{account.username} · {account.password}</span></span><span className={`rounded px-2 py-1 text-[10px] font-bold ${account.role === "OM" ? "bg-blue-400/20 text-blue-200" : account.role === "Manager" ? "bg-violet-400/20 text-violet-200" : "bg-slate-700 text-slate-300"}`}>{account.role}</span></button>)}</div></div>
    <div className="p-8 md:p-12"><div className="mb-8"><span className="text-xs font-bold tracking-widest text-blue-600">ĐĂNG NHẬP</span><h2 className="mt-2 text-2xl font-bold text-slate-900">Chào mừng trở lại</h2><p className="mt-2 text-sm text-slate-500">Chọn tài khoản mẫu bên trái hoặc nhập thông tin để tiếp tục.</p></div><form onSubmit={submit} className="space-y-5"><label className="block text-sm font-semibold text-slate-700">Tài khoản<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="phuong.om"/></label><label className="block text-sm font-semibold text-slate-700">Mật khẩu<input type="text" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"><LogIn size={17}/> Đăng nhập Workspace</button></form><p className="mt-6 flex items-center gap-2 text-xs text-slate-400"><KeyRound size={14}/> Dữ liệu đăng nhập chỉ dành cho kiểm thử UI.</p></div>
  </section></main>;
}
