import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { requirePermission } from "@/lib/auth/rbac";
import { apiError, getPaginationParams, paginatedResponse } from "@/lib/api/responses";
import { logger } from "@/lib/observability/logger";
import { eq, desc, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { createAccountSchema } from "@/lib/validators/account";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("account:read");

    const { limit, offset } = getPaginationParams(request.nextUrl);

    const items = await db.select()
      .from(accounts)
      .where(eq(accounts.isDeleted, false))
      .orderBy(desc(accounts.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(eq(accounts.isDeleted, false));

    return paginatedResponse(items, Number(count), limit, offset);
  } catch (error: Error | unknown) {
    if (error.message.includes("Forbidden")) {
      return apiError("Forbidden", "FORBIDDEN", 403);
    }
    logger.error("List accounts error", { error: error.message });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("account:create");

    const body = await request.json();
    const result = createAccountSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, result.error.errors);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [account] = await db.insert(accounts)
      .values({
        ...result.data,
        ownerId: user?.id,
      })
      .returning();

    logger.info("Account created", { accountId: account.id, actorId: user?.id });

    return new Response(JSON.stringify(account), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: Error | unknown) {
    if (error.message.includes("Forbidden")) {
      return apiError("Forbidden", "FORBIDDEN", 403);
    }
    logger.error("Create account error", { error: error.message });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
