"use client";

import { useEffect, type ReactNode } from "react";
import {
  consumeExplicitSignInFlag,
  signOutUser,
  subscribeToAuthChanges,
} from "@/services/firebase/auth";
import { isSessionExpired, loadUserDoc, recordSignIn } from "@/services/firebase/users";
import { setInitialized, setUser } from "@/features/auth/authSlice";
import { useAppDispatch } from "@/store/hooks";

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (!firebaseUser) {
        dispatch(setUser(null));
        dispatch(setInitialized(true));
        return;
      }

      const isFreshSignIn = consumeExplicitSignInFlag();

      try {
        if (isFreshSignIn) {
          const appUser = await recordSignIn(firebaseUser);
          dispatch(setUser(appUser));
        } else {
          const appUser = await loadUserDoc(firebaseUser);
          if (isSessionExpired(appUser.lastLoginAt)) {
            await signOutUser();
            dispatch(setUser(null));
          } else {
            dispatch(setUser(appUser));
          }
        }
      } catch (error) {
        console.error("Failed to sync user session", error);
        dispatch(setUser(null));
      } finally {
        dispatch(setInitialized(true));
      }
    });

    return unsubscribe;
  }, [dispatch]);

  return <>{children}</>;
}
