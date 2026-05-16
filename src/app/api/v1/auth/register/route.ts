import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import { z } from "zod";
import { logger } from "@/lib/observability/logger";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  fullName: z.string().min(2, "Full name is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, result.error.errors);
    }

    const { email, password, fullName } = result.data;
    const supabase = await createClient();

    // The database trigger "handle_new_user" will automatically create
    // the public.users record when this auth user is created.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      logger.warn("Registration failed", { email, error: error.message });
      return apiError(error.message, "REGISTER_ERROR", 400);
    }

    logger.info("User registered", { userId: data.user?.id });

    return NextResponse.json({
      user: data.user,
      session: data.session,
    }, { status: 201 });
  } catch (error: Error | unknown) {
    logger.error("Registration route error", { error: error.message });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
