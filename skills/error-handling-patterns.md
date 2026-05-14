# Error Handling

> **Source of Truth:** This skill defines ALL error handling rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 11.1 Backend Error Handling

- **HTTPException:** Caught by global exception handler and returned as JSON: `{"error": {"code": "HTTP_ERROR", "message": exc.detail}}`.
- **Unhandled Exceptions:** Global handler catches all unhandled exceptions, logs full traceback (`logger.exception("unhandled_error", path=...)`), returns 500: `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}}`.
- **Rate Limit Exceeded:** Handled by `slowapi` default handler.
- **Payload Too Large:** 413 error with structured JSON body.
- **Invalid Host:** 400 error with structured JSON body.
- **Duplicate Email:** Service layer catches DB exception and returns 409: `{"detail": "Email already registered"}`.
- **Service Errors:** Services raise `HTTPException` with appropriate status codes. Never expose internal details in error messages.

---

## 11.2 Frontend Error Handling

- **ErrorBoundary:** Class component wrapping the entire app. Catches rendering errors. Shows fallback UI with reload button.
- **React Query Errors:** Every `useQuery`/`useMutation` MUST handle `isError` and `error` states. Display user-friendly error messages (NOT raw error objects).
- **Axios Interceptor:** Handles 401 (refresh attempt + retry, or redirect to login). Network errors: exponential backoff retry.
- **Page-Level:** Every page MUST handle four states: loading (Skeleton), empty (message), error (message + retry), success (data).
- **Form Errors:** Display validation errors inline below fields. Display API errors (e.g., "Email already registered") as general form error.
