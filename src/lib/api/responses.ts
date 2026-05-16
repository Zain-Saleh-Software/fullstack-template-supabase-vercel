import { NextResponse } from "next/server";

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * Helper to standardise API error responses.
 */
export function apiError(
  message: string,
  code: string = "INTERNAL_SERVER_ERROR",
  status: number = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

/**
 * Helper to standardise paginated success responses.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
) {
  return NextResponse.json({
    data,
    total,
    limit,
    offset,
  });
}

/**
 * Extracts limit and offset from a NextRequest URL search params,
 * with sensible defaults and max limits.
 */
export function getPaginationParams(url: URL) {
  const limitStr = url.searchParams.get("limit");
  const offsetStr = url.searchParams.get("offset");

  let limit = limitStr ? parseInt(limitStr, 10) : 100;
  if (isNaN(limit) || limit < 1) limit = 100;
  if (limit > 1000) limit = 1000; // max limit

  let offset = offsetStr ? parseInt(offsetStr, 10) : 0;
  if (isNaN(offset) || offset < 0) offset = 0;

  return { limit, offset };
}
