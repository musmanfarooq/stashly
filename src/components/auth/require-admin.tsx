"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { FullPageLoader } from "@/components/layout/full-page-loader";

/**
 * Non-admins get redirected, not a disabled/read-only view — the page must
 * be unreachable even via direct URL entry (2.10, checklist 4.8).
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, initialized } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user?.isAdmin) {
      router.replace("/");
    }
  }, [initialized, user, router]);

  if (!initialized || !user?.isAdmin) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
