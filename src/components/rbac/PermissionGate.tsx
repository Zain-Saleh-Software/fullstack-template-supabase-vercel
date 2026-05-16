"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { PermissionType } from "@/lib/auth/rbac";

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: PermissionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkPermission() {
      // In a real app, you'd fetch the user profile containing permissions
      // from your /api/v1/auth/me endpoint and cache it with React Query.
      // For this template, we fetch it if not cached.
      try {
        const res = await fetch("/api/v1/auth/me");
        if (!res.ok) {
          setIsAllowed(false);
          return;
        }
        const data = await res.json();
        const perms: string[] = data.user?.permissions || [];
        const isSuper = data.user?.isSuperuser;
        
        if (isSuper) {
          setIsAllowed(true);
          return;
        }

        const [resType, action] = permission.split(":");
        const hasPerm = perms.some(
          (p) => p === permission || p === `${resType}:*` || p === `*:${action}` || p === `*:*`
        );
        setIsAllowed(hasPerm);
      } catch {
        setIsAllowed(false);
      }
    }

    checkPermission();
  }, [permission]);

  if (isAllowed === null) return null; // loading
  if (!isAllowed) return <>{fallback}</>;

  return <>{children}</>;
}
