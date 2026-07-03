"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuthChanges } from "@/services/auth";
import { getMyMembership, type MembershipWithOrg } from "@/services/organizations";

export interface AuthContextValue {
  user: User | null;
  membership: MembershipWithOrg | null;
  loading: boolean;
  refreshMembership: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<MembershipWithOrg | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMembership = useCallback(async (uid: string) => {
    const result = await getMyMembership(uid);
    setMembership(result);
  }, []);

  const refreshMembership = useCallback(async () => {
    if (user) await loadMembership(user.uid);
  }, [user, loadMembership]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await loadMembership(nextUser.uid);
      } else {
        setMembership(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadMembership]);

  return (
    <AuthContext.Provider value={{ user, membership, loading, refreshMembership }}>
      {children}
    </AuthContext.Provider>
  );
}
