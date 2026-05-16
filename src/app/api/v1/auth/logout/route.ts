import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import { logger } from "@/lib/observability/logger";

export async function POST() {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.warn("Logout error", { error: error.message });
      return apiError("Failed to logout", "LOGOUT_ERROR", 500);
    }

    logger.info("User logged out");
    
    return NextResponse.json({ success: true });
  } catch (error: Error | unknown) {
    logger.error("Logout route error", { error: error.message });
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
