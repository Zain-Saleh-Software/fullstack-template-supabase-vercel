import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accountType: z.enum(["customer", "partner", "vendor"]).default("customer"),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  accountType: z.enum(["customer", "partner", "vendor"]).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
