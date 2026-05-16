import { z } from "zod";

// Base validator for UUIDs
export const uuidSchema = z.string().uuid();

// Base pagination parameters
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0),
});

// Common entity fields
export const baseEntitySchema = z.object({
  id: uuidSchema,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
