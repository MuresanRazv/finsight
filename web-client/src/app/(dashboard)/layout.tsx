"use server";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";
import {getSession} from "@/lib/session";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <WebSocketProvider token={session.token}>
      <div className="h-full relative">
        <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80 bg-gray-900">
          <Sidebar />
        </div>
        <main className="md:pl-72 h-full bg-slate-950">
          <TopNav />
          <div className="p-8 h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </WebSocketProvider>
  );
}
