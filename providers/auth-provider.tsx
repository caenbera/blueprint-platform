"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuthChanges } from "@/services/auth";
import { getMyMembership, type MembershipWithOrg } from "@/services/organizations";
import { checkIsSuperAdmin } from "@/services/platform-admin";

export interface AuthContextValue {
  user: User | null;
  membership: MembershipWithOrg | null;
  isSuperAdmin: boolean;
  loading: boolean;
  refreshMembership: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<MembershipWithOrg | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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
        await Promise.all([
          loadMembership(nextUser.uid),
          checkIsSuperAdmin(nextUser.uid).then(setIsSuperAdmin),
        ]);
      } else {
        setMembership(null);
        setIsSuperAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadMembership]);

  return (
    <AuthContext.Provider value={{ user, membership, isSuperAdmin, loading, refreshMembership }}>
      {children}
    </AuthContext.Provider>
  );
}
