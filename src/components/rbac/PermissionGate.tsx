"use client";

import { useQuery } from "@tanstack/react-query";
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
  const { data, isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
  });

  if (isLoading) return null;
  if (!data?.user) return <>{fallback}</>;

  const perms: string[] = data.user.permissions || [];
  const isSuper = data.user.isSuperuser;

  if (isSuper) return <>{children}</>;

  const [resType, action] = permission.split(":");
  const hasPerm = perms.some(
    (p) => p === permission || p === `${resType}:*` || p === `*:${action}` || p === `*:*`
  );

  return hasPerm ? <>{children}</> : <>{fallback}</>;
}
