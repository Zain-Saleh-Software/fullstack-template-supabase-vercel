/**
 * ❌ BAD API Route Example
 * 
 * This example demonstrates ANTI-PATTERNS that violate the template's rules.
 * DO NOT write code like this. This is shown to illustrate what NOT to do.
 * 
 * Issues in this code:
 * - Missing permission checks
 * - No input validation
 * - Using console.log instead of logger
 * - Using error: any in catch blocks
 * - Missing error boundaries
 * - Exposing internal errors to client
 * - Not using standardized response helpers
 * - SQL injection vulnerability (raw SQL)
 * - Missing authentication checks
 * - Hard deletes instead of soft deletes
 * - No structured logging
 * - Missing JSDoc comments
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

// ❌ BAD: No permission checking
// ❌ BAD: No authentication check
// ❌ BAD: No input validation
export async function GET(request: NextRequest) {
    try {
        // ❌ BAD: Using raw SQL instead of Drizzle ORM (SQL injection risk)
        const items = await db.execute(sql`SELECT * FROM accounts`);

        // ❌ BAD: Using console.log instead of logger
        console.log("Got accounts:", items);

        // ❌ BAD: Not using standardized response helpers
        return new Response(JSON.stringify(items));
    } catch (error: any) {
        // ❌ BAD: Using error: any instead of error: unknown
        // ❌ BAD: Exposing internal error to client
        console.log("Error:", error);
        return new Response(JSON.stringify({ error: error.message }));
    }
}

// ❌ BAD: No validation
// ❌ BAD: No permission check
export async function POST(request: NextRequest) {
    try {
        // ❌ BAD: No validation of request body
        const body = await request.json();

        // ❌ BAD: No authentication - anyone can create accounts
        // ❌ BAD: No owner_id being set
        const account = await db.insert(accounts).values(body);

        // ❌ BAD: Using console.log
        console.log("Created account:", account);

        // ❌ BAD: Not using proper response format
        return new Response(JSON.stringify(account));
    } catch (error: any) {
        // ❌ BAD: Exposing stack trace
        console.log(error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack // ❌ SECURITY RISK: Exposing stack trace
        }));
    }
}

// ❌ BAD: Hard delete instead of soft delete
export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.pathname.split("/").pop();

        // ❌ BAD: Hard delete - data is permanently lost
        await db.delete(accounts).where(sql`id = ${id}`);

        // ❌ BAD: No logging
        return new Response(JSON.stringify({ message: "Deleted" }));
    } catch (error: any) {
        // ❌ BAD: Poor error handling
        return new Response(JSON.stringify({ error: "Something went wrong" }));
    }
}

// ❌ BAD: Missing PATCH implementation
// ❌ BAD: No error boundary
// ❌ BAD: No proper TypeScript typing