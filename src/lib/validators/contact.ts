import { z } from "zod";

export const createContactSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    jobTitle: z.string().optional().or(z.literal("")),
    accountId: z.string().uuid("Invalid account ID"),
    isPrimary: z.boolean().default(false),
});

export const updateContactSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal("")).optional(),
    phone: z.string().optional().or(z.literal("")).optional(),
    jobTitle: z.string().optional().or(z.literal("")).optional(),
    isPrimary: z.boolean().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;