"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/services/firebase/auth";
import { useAppSelector } from "@/store/hooks";

export default function LoginPage() {
  const { user, initialized } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (initialized && user) {
      router.replace("/");
    }
  }, [initialized, user, router]);

  async function handleSignIn() {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      // Left true: the auth-state listener still needs to update Redux and
      // the effect above still needs to redirect, so the loader below stays
      // up to cover that gap instead of flashing the button back first.
    } catch {
      toast.error("Sign-in failed. Please try again.");
      setIsSigningIn(false);
    }
  }

  if (initialized && user) {
    return null;
  }

  if (isSigningIn) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-background px-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stashly</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your stock and crypto portfolio.
          </p>
        </div>
        <Button className="w-full gap-2" onClick={handleSignIn}>
          <LogIn className="size-4" />
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
