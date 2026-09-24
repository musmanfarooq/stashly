"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
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
      toast.success("Signed in successfully");
    } catch {
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  }

  if (initialized && user) {
    return null;
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
        <Button className="w-full gap-2" onClick={handleSignIn} disabled={isSigningIn}>
          <LogIn className="size-4" />
          {isSigningIn ? "Signing in..." : "Sign in with Google"}
        </Button>
      </div>
    </div>
  );
}
