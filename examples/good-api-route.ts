/**
 * ✅ GOOD API Route Example
 * 
 * This example demonstrates all the best practices for creating API routes
 * in this Next.js + Supabase template.
 * 
 * Key features:
 * - Proper permission checking with requirePermission
 * - Zod validation for request bodies
 * - Standardized response helpers (apiError, paginatedResponse)
 * - Structured logging with logger
 * - Proper error handling with catch (error: unknown)
 * - Type safety throughout
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { requirePermission } from "@/lib/auth/rbac";
import { apiError, getPaginationParams, paginatedResponse } from "@/lib/api/responses";
import { logger } from "@/lib/observability/logger";
import { eq, desc, sql, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { createAccountSchema, updateAccountSchema } from "@/lib/validators/account";

/**
 * GET /api/v1/accounts
 * Retrieves a paginated list of accounts for the authenticated user.
 * 
 * @throws {403} If user lacks account:read permission
 * @throws {500} If an internal error occurs
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Check permission
        await requirePermission("account:read");

        // 2. Get pagination parameters
        const { limit, offset } = getPaginationParams(request.nextUrl);

        // 3. Get current user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", "UNAUTHORIZED", 401);
        }

        // 4. Fetch accounts (only user's own accounts)
        const items = await db.select()
            .from(accounts)
            .where(and(
                eq(accounts.isDeleted, false),
                eq(accounts.ownerId, user.id)
            ))
            .orderBy(desc(accounts.createdAt))
            .limit(limit)
            .offset(offset);

        // 5. Get total count
        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
            .from(accounts)
            .where(and(
                eq(accounts.isDeleted, false),
                eq(accounts.ownerId, user.id)
            ));

        // 6. Return standardized response
        return paginatedResponse(items, Number(count), limit, offset);
    } catch (error: unknown) {
        // 7. Proper error handling
        if (error instanceof Error) {
            if (error.message.includes("Forbidden")) {
                return apiError("Forbidden", "FORBIDDEN", 403);
            }
            logger.error("List accounts error", { error: error.message });
        }
        return apiError("Internal server error", "INTERNAL_ERROR", 500);
    }
}

/**
 * POST /api/v1/accounts
 * Creates a new account.
 * 
 * @throws {400} If validation fails
 * @throws {403} If user lacks account:create permission
 * @throws {500} If an internal error occurs
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Check permission
        await requirePermission("account:create");

        // 2. Parse and validate request body
        const body = await request.json();
        const result = createAccountSchema.safeParse(body);

        if (!result.success) {
            return apiError(
                "Validation failed",
                "VALIDATION_ERROR",
                400,
                result.error.errors
            );
        }

        // 3. Get current user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", "UNAUTHORIZED", 401);
        }

        // 4. Create account
        const [account] = await db.insert(accounts)
            .values({
                ...result.data,
                ownerId: user.id,
            })
            .returning();

        // 5. Log the action
        logger.info("Account created", {
            accountId: account.id,
            actorId: user.id
        });

        // 6. Return created resource
        return new Response(JSON.stringify(account), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message.includes("Forbidden")) {
                return apiError("Forbidden", "FORBIDDEN", 403);
            }
            logger.error("Create account error", { error: error.message });
        }
        return apiError("Internal server error", "INTERNAL_ERROR", 500);
    }
}

/**
 * PATCH /api/v1/accounts/[id]
 * Updates an existing account.
 * 
 * @throws {400} If validation fails
 * @throws {403} If user lacks account:update permission
 * @throws {404} If account not found
 * @throws {500} If an internal error occurs
 */
export async function PATCH(request: NextRequest) {
    try {
        // 1. Check permission
        await requirePermission("account:update");

        // 2. Extract ID from URL
        const url = new URL(request.url);
        const id = url.pathname.split("/").pop();

        if (!id) {
            return apiError("Invalid account ID", "INVALID_ID", 400);
        }

        // 3. Parse and validate request body
        const body = await request.json();
        const result = updateAccountSchema.safeParse(body);

        if (!result.success) {
            return apiError(
                "Validation failed",
                "VALIDATION_ERROR",
                400,
                result.error.errors
            );
        }

        // 4. Get current user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", "UNAUTHORIZED", 401);
        }

        // 5. Update account (only if user owns it)
        const [updatedAccount] = await db.update(accounts)
            .set({
                ...result.data,
                updatedAt: new Date(),
            })
            .where(and(
                eq(accounts.id, id),
                eq(accounts.ownerId, user.id),
                eq(accounts.isDeleted, false)
            ))
            .returning();

        if (!updatedAccount) {
            return apiError("Account not found", "NOT_FOUND", 404);
        }

        // 6. Log the action
        logger.info("Account updated", {
            accountId: updatedAccount.id,
            actorId: user.id
        });

        // 7. Return updated resource
        return new Response(JSON.stringify(updatedAccount), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message.includes("Forbidden")) {
                return apiError("Forbidden", "FORBIDDEN", 403);
            }
            logger.error("Update account error", { error: error.message });
        }
        return apiError("Internal server error", "INTERNAL_ERROR", 500);
    }
}

/**
 * DELETE /api/v1/accounts/[id]
 * Soft deletes an account.
 * 
 * @throws {403} If user lacks account:delete permission
 * @throws {404} If account not found
 * @throws {500} If an internal error occurs
 */
export async function DELETE(request: NextRequest) {
    try {
        // 1. Check permission
        await requirePermission("account:delete");

        // 2. Extract ID from URL
        const url = new URL(request.url);
        const id = url.pathname.split("/").pop();

        if (!id) {
            return apiError("Invalid account ID", "INVALID_ID", 400);
        }

        // 3. Get current user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", "UNAUTHORIZED", 401);
        }

        // 4. Soft delete (only if user owns it)
        const [deletedAccount] = await db.update(accounts)
            .set({
                isDeleted: true,
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(and(
                eq(accounts.id, id),
                eq(accounts.ownerId, user.id),
                eq(accounts.isDeleted, false)
            ))
            .returning();

        if (!deletedAccount) {
            return apiError("Account not found", "NOT_FOUND", 404);
        }

        // 5. Log the action
        logger.info("Account deleted", {
            accountId: deletedAccount.id,
            actorId: user.id
        });

        // 6. Return success
        return new Response(JSON.stringify({
            message: "Account deleted successfully",
            account: deletedAccount
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message.includes("Forbidden")) {
                return apiError("Forbidden", "FORBIDDEN", 403);
            }
            logger.error("Delete account error", { error: error.message });
        }
        return apiError("Internal server error", "INTERNAL_ERROR", 500);
    }
}