import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { requirePermission } from "@/lib/auth/rbac";
import { apiError } from "@/lib/api/responses";
import { logger } from "@/lib/observability/logger";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { updateContactSchema } from "@/lib/validators/contact";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission("contact:read");
        const { id } = await params;

        const [contact] = await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, id), eq(contacts.isDeleted, false)));

        if (!contact) {
            return apiError("Contact not found", "NOT_FOUND", 404);
        }

        return NextResponse.json(contact);
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("Forbidden")) {
            return apiError("Forbidden", "FORBIDDEN", 403);
        }
        logger.error("Get contact error", {
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
        await requirePermission("contact:update");
        const { id } = await params;

        const body = await request.json();
        const result = updateContactSchema.safeParse(body);

        if (!result.success) {
            return apiError("Validation failed", "VALIDATION_ERROR", 400, result.error.errors);
        }

        const [contact] = await db
            .update(contacts)
            .set(result.data)
            .where(and(eq(contacts.id, id), eq(contacts.isDeleted, false)))
            .returning();

        if (!contact) {
            return apiError("Contact not found", "NOT_FOUND", 404);
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        logger.info("Contact updated", { contactId: contact.id, actorId: user?.id });

        return NextResponse.json(contact);
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("Forbidden")) {
            return apiError("Forbidden", "FORBIDDEN", 403);
        }
        logger.error("Update contact error", {
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
        await requirePermission("contact:delete");
        const { id } = await params;

        const [contact] = await db
            .update(contacts)
            .set({ isDeleted: true, deletedAt: new Date() })
            .where(and(eq(contacts.id, id), eq(contacts.isDeleted, false)))
            .returning();

        if (!contact) {
            return apiError("Contact not found", "NOT_FOUND", 404);
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        logger.info("Contact deleted", { contactId: contact.id, actorId: user?.id });

        return new Response(null, { status: 204 });
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("Forbidden")) {
            return apiError("Forbidden", "FORBIDDEN", 403);
        }
        logger.error("Delete contact error", {
            error: error instanceof Error ? error.message : String(error),
        });
        return apiError("Internal server error", "INTERNAL_ERROR", 500);
    }
}