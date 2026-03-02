"use client"

import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export function TopNav() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  return (
    <div className="flex items-center p-4 border-b border-slate-800 bg-slate-950">
      <div className="flex w-full justify-end">
        <div className="flex items-center gap-x-4">
          <Button
              onClick={() => router.push('/settings')}
              variant="ghost" size="icon" className="rounded-full bg-slate-800 text-white hover:bg-slate-700">
            <User className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-slate-800 text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
