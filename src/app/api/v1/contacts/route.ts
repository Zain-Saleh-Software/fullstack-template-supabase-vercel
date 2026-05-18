import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { requirePermission } from "@/lib/auth/rbac";
import { apiError, getPaginationParams, paginatedResponse } from "@/lib/api/responses";
import { logger } from "@/lib/observability/logger";
import { eq, desc, sql, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { createContactSchema } from "@/lib/validators/contact";

export async function GET(request: NextRequest) {
    try {
        await requirePermission("contact:read");

        const { limit, offset } = getPaginationParams(request.nextUrl);
        const accountId = request.nextUrl.searchParams.get("accountId");

        const whereConditions = [eq(contacts.isDeleted, false)];
        if (accountId) {
            whereConditions.push(eq(contacts.accountId, accountId));
        }

        const items = await db
            .select()
            .from(contacts)
            .where(and(...whereConditions))
            .orderBy(desc(contacts.createdAt))
            .limit(limit)
            .offset(offset);

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(contacts)
            .where(and(...whereConditions));

        return paginatedResponse(items, Number(count), limit, offset);
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("Forbidden")) {
            return apiError("Forbidden", "FORBIDDEN", 403);
        }
        logger.error("List contacts error", {
            error: error instanceof Error ? error.message : String(error),
        });
        return apiError("Internal server error", "INTERNAL_ERROR", 500);
    }
}

export async function POST(request: NextRequest) {
    try {
        await requirePermission("contact:create");

        const body = await request.json();
        const result = createContactSchema.safeParse(body);

        if (!result.success) {
            return apiError("Validation failed", "VALIDATION_ERROR", 400, result.error.errors);
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const [contact] = await db.insert(contacts)
            .values({
                ...result.data,
                ownerId: user?.id,
            })
            .returning();

        logger.info("Contact created", { contactId: contact.id, actorId: user?.id });

        return NextResponse.json(contact, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("Forbidden")) {
            return apiError("Forbidden", "FORBIDDEN", 403);
        }
        logger.error("Create contact error", {
            error: error instanceof Error ? error.message : String(error),
        });
        return apiError("Internal server error", "INTERNAL_ERROR", 500);
    }
}