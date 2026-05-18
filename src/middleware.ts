import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ["en", "ar"],
  // Used when no locale matches
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export async function middleware(request: NextRequest) {
  // 1. First run the next-intl middleware for routing
  const intlResponse = intlMiddleware(request);

  // If next-intl decided to redirect (e.g. adding a locale prefix), return that immediately
  if (intlResponse.status !== 200 && intlResponse.headers.get("x-middleware-rewrite") === null) {
    return intlResponse;
  }

  // 2. Run Supabase auth middleware
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
