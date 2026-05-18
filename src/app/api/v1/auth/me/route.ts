import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import { db } from "@/lib/db";
import { users, roles, permissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/observability/logger";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Fetch user profile and permissions from public schema
    const profileData = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        isSuperuser: users.isSuperuser,
        roleName: roles.name,
        action: permissions.action,
        resource: permissions.resource,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(permissions, eq(roles.id, permissions.roleId))
      .where(eq(users.id, user.id));

    if (!profileData.length) {
      // Edge case: user exists in auth but trigger hasn't fired or failed
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          permissions: [],
        }
      });
    }

    // Format the response
    const profile = profileData[0];
    const userPermissions = profileData
      .filter((p) => p.action && p.resource)
      .map((p) => `${p.resource}:${p.action}`);

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: profile.roleName,
        isSuperuser: profile.isSuperuser,
        permissions: userPermissions,
      }
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Auth me route error", { error: error.message });
    }
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
