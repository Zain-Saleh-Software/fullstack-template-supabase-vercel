import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import { z } from "zod";
import { logger } from "@/lib/observability/logger";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return apiError("Invalid credentials format", "VALIDATION_ERROR", 400, result.error.errors);
    }

    const { email, password } = result.data;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn("Login failed", { email, error: error.message });
      return apiError("Invalid email or password", "AUTH_ERROR", 401);
    }

    logger.info("User logged in", { userId: data.user.id });

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (error: Error | unknown) {
    logger.error("Login route error", { error: error.message });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
