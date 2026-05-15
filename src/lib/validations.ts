import { z } from "zod";

// Auth schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  countryCode: z.string().length(2, "Country code must be 2 characters (ISO)"),
  industry: z.string().min(2, "Industry is required"),
  walletAddress: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Invoice schemas
export const createInvoiceSchema = z.object({
  buyerId: z.string().min(1, "Buyer is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});

export const approveInvoiceSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
});

export const settleInvoiceSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
