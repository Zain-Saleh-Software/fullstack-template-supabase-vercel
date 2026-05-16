import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { requirePermission } from "@/lib/auth/rbac";
import { apiError } from "@/lib/api/responses";
import { z } from "zod";
import { logger } from "@/lib/observability/logger";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  accountType: z.enum(["customer", "partner", "vendor"]).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("account:read");

    const [account] = await db.select()
      .from(accounts)
      .where(and(eq(accounts.id, params.id), eq(accounts.isDeleted, false)));

    if (!account) {
      return apiError("Account not found", "NOT_FOUND", 404);
    }

    return NextResponse.json(account);
  } catch (error: any) {
    if (error.message.includes("Forbidden")) return apiError("Forbidden", "FORBIDDEN", 403);
    logger.error("Get account error", { error: error.message });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("account:update");

    const body = await request.json();
    const result = updateAccountSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, result.error.errors);
    }

    const [account] = await db.update(accounts)
      .set(result.data)
      .where(and(eq(accounts.id, params.id), eq(accounts.isDeleted, false)))
      .returning();

    if (!account) {
      return apiError("Account not found", "NOT_FOUND", 404);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    logger.info("Account updated", { accountId: account.id, actorId: user?.id });

    return NextResponse.json(account);
  } catch (error: any) {
    if (error.message.includes("Forbidden")) return apiError("Forbidden", "FORBIDDEN", 403);
    logger.error("Update account error", { error: error.message });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("account:delete");

    const [account] = await db.update(accounts)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(and(eq(accounts.id, params.id), eq(accounts.isDeleted, false)))
      .returning();

    if (!account) {
      return apiError("Account not found", "NOT_FOUND", 404);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    logger.info("Account deleted", { accountId: account.id, actorId: user?.id });

    return new Response(null, { status: 204 });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) return apiError("Forbidden", "FORBIDDEN", 403);
    logger.error("Delete account error", { error: error.message });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
