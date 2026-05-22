import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  if (intlResponse.status !== 200 && intlResponse.headers.get("x-middleware-rewrite") === null) {
    return intlResponse;
  }

  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
