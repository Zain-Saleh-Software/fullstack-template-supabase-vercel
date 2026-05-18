import { db } from "../db";
import { permissions, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "../supabase/server";

export type PermissionType =
  // System Administration
  | "system:read"
  | "system:write"
  // Users & Roles
  | "user:read"
  | "user:write"
  | "user:delete"
  | "role:read"
  | "role:write"
  // Accounts (POC)
  | "account:read"
  | "account:create"
  | "account:update"
  | "account:delete"
  // Contacts (POC)
  | "contact:read"
  | "contact:create"
  | "contact:update"
  | "contact:delete";

/**
 * Split a permission string into resource and action
 * e.g. "account:create" -> { resource: "account", action: "create" }
 */
function parsePermission(perm: PermissionType) {
  const [resource, action] = perm.split(":");
  return { resource, action };
}

/**
 * Checks if the currently authenticated user has the required permission.
 * Uses the server-side Supabase client to get the user ID, then checks
 * the database for the user's role and associated permissions.
 */
export async function hasPermission(permission: PermissionType): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Fetch the user's role and permissions
  const result = await db
    .select({
      isSuperuser: users.isSuperuser,
      roleId: users.roleId,
      action: permissions.action,
      resource: permissions.resource,
    })
    .from(users)
    .leftJoin(permissions, eq(users.roleId, permissions.roleId))
    .where(eq(users.id, user.id));

  if (!result || result.length === 0) return false;

  // Superusers bypass all permission checks
  if (result[0].isSuperuser) return true;

  const target = parsePermission(permission);

  // Check if any of the user's permissions match the required one
  return result.some(
    (row) =>
      row.resource &&
      row.action &&
      (row.resource === target.resource || row.resource === "*") &&
      (row.action === target.action || row.action === "*")
  );
}

/**
 * API Route middleware helper to require a permission.
 * Throws a 403 response if the user lacks the permission.
 */
export async function requirePermission(permission: PermissionType) {
  const allowed = await hasPermission(permission);
  if (!allowed) {
    throw new Error(`Forbidden: Requires ${permission}`);
  }
}
