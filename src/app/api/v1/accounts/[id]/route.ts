import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { requirePermission } from "@/lib/auth/rbac";
import { apiError } from "@/lib/api/responses";
import { logger } from "@/lib/observability/logger";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { updateAccountSchema } from "@/lib/validators/account";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("account:read");
    const { id } = await params;

    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.isDeleted, false)));

    if (!account) {
      return apiError("Account not found", "NOT_FOUND", 404);
    }

    return NextResponse.json(account);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Forbidden"))
      return apiError("Forbidden", "FORBIDDEN", 403);
    logger.error("Get account error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("account:update");
    const { id } = await params;

    const body = await request.json();
    const result = updateAccountSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, result.error.errors);
    }

    const [account] = await db
      .update(accounts)
      .set(result.data)
      .where(and(eq(accounts.id, id), eq(accounts.isDeleted, false)))
      .returning();

    if (!account) {
      return apiError("Account not found", "NOT_FOUND", 404);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    logger.info("Account updated", { accountId: account.id, actorId: user?.id });

    return NextResponse.json(account);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Forbidden"))
      return apiError("Forbidden", "FORBIDDEN", 403);
    logger.error("Update account error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("account:delete");
    const { id } = await params;

    const [account] = await db
      .update(accounts)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(and(eq(accounts.id, id), eq(accounts.isDeleted, false)))
      .returning();

    if (!account) {
      return apiError("Account not found", "NOT_FOUND", 404);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    logger.info("Account deleted", { accountId: account.id, actorId: user?.id });

    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Forbidden"))
      return apiError("Forbidden", "FORBIDDEN", 403);
    logger.error("Delete account error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
