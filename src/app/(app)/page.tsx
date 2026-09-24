"use client";

import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { useAppSelector } from "@/store/hooks";

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your portfolio at a glance.</p>
      </div>
      <DashboardContent userId={user.uid} />
    </div>
  );
}
