import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNav() {
  return (
    <div className="flex items-center p-4 border-b border-slate-800 bg-slate-950">
      <div className="flex w-full justify-end">
        <div className="flex items-center gap-x-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-slate-800 text-white hover:bg-slate-700">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
