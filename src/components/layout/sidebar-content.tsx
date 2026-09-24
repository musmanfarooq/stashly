"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bitcoin,
  History,
  LayoutDashboard,
  LineChart,
  Layers,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOutUser } from "@/services/firebase/auth";
import { useAppSelector } from "@/store/hooks";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stocks", label: "Stocks", icon: LineChart },
  { href: "/crypto", label: "Crypto", icon: Bitcoin },
  { href: "/holdings", label: "Holdings", icon: Layers },
  { href: "/transactions", label: "Transactions", icon: History },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  async function handleLogout() {
    try {
      await signOutUser();
      toast.success("Signed out");
      router.replace("/login");
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  }

  const initials = (user?.displayName ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex w-full h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-semibold tracking-tight text-primary">Stashly</span>
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:cursor-pointer ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <Separator className="bg-sidebar-border" />
      <div className="flex items-center gap-2 p-3">
        <Avatar className="size-8">
          <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? "User"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.displayName ?? "User"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <div className="p-3 pt-0">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
