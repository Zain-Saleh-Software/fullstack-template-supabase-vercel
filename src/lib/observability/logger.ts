import * as Sentry from "@sentry/nextjs";

/**
 * Structured logging and tracing utility.
 * Replaces the Python structlog + OpenTelemetry implementation.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  return JSON.stringify(payload);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, context));
    }
  },
  info: (message: string, context?: Record<string, unknown>) => {
    console.info(formatLog("info", message, context));
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(formatLog("warn", message, context));
    if (context?.error) {
      Sentry.captureException(context.error, { extra: context });
    }
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(formatLog("error", message, context));
    if (context?.error) {
      Sentry.captureException(context.error, { extra: context });
    } else {
      Sentry.captureMessage(message, { level: "error", extra: context });
    }
  },
};

/**
 * Creates a performance span manually for tracing specific operations
 * Replaces @async_trace decorator
 */
export async function withTrace<T>(
  name: string,
  op: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    async () => {
      return await fn();
    }
  );
}
