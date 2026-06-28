import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{session.name}</p>
            <p className="text-xs text-slate-500">
              {session.email} · {session.role}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <form action={logoutAction}>
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
