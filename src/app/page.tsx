"use client";

import { useEffect, useState } from "react";
import { LoginScreen, type DemoAccount } from "@/features/auth/login-screen";
import { WorkspaceApp } from "@/components/workspace-app";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function Home() {
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    fetch("/api/auth/session").then((response) => response.ok ? response.json() as Promise<{ data: { id: string; username: string; name: string; role: DemoAccount["role"] } }> : null).then((payload) => {
      if (payload) setAccount((current) => current ?? demoAccountForSession(payload.data));
    }).finally(() => setCheckingSession(false));
  }, []);
  if (checkingSession) return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm font-medium text-slate-500">Đang kiểm tra phiên đăng nhập...</main>;
  return account ? <AuthenticatedWorkspace account={account} /> : <LoginScreen onLogin={setAccount} />;
}

function AuthenticatedWorkspace({ account }: { account: DemoAccount }) {
  const hydrate = useWorkspaceStore((state) => state.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
  return <WorkspaceApp currentUser={account} />;
}

function demoAccountForSession({ id, username, name, role }: Pick<DemoAccount, "id" | "username" | "name" | "role">): DemoAccount {
  return { id, username, password: "", name, role, initials: name.split(/\s+/).map((part) => part[0]).slice(-2).join("").toUpperCase() || "US" };
}
