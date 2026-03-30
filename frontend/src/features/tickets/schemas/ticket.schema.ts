import { z } from "zod";

export const ticketStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "DONE"]);

export const createTicketFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(255, "Description: max 255 characters"),
});

export type CreateTicketFormValues = z.infer<typeof createTicketFormSchema>;

export const updateTicketFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(255, "Description: max 255 characters"),
  status: ticketStatusSchema,
  updatedAt: z.string().min(1, "updatedAt is required"),
});

export type UpdateTicketFormValues = z.infer<typeof updateTicketFormSchema>;
