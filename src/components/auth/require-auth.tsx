"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { FullPageLoader } from "@/components/layout/full-page-loader";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, initialized } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login");
    }
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
