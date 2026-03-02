import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import {logoutUser, refreshToken} from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  const API_URL = process.env.INTERNAL_API_URL || "http://core-api:8080/api";
  let shouldRedirectLogin = false;
  
  try {
    const response = await fetch(`${API_URL}/user/me`, {
      headers: {
        "Authorization": `Bearer ${session.token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      const refreshResult = await refreshToken();
      if (!refreshResult.success) {
        shouldRedirectLogin = true;
      }
    }
  } catch (error) {
    console.error("Error checking token validity:", error);
  }

  if (shouldRedirectLogin) {
    logoutUser().then(() => redirect("/login"))
  }

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>
      <main className="md:pl-72 h-full bg-slate-950">
        <TopNav />
        <div className="p-8 h-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
