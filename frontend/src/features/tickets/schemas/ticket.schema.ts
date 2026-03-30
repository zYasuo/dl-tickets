import { z } from "zod";

export const ticketStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "DONE"]);

export const createTicketFormSchema = z.object({
  userId: z.string().uuid("UUID de utilizador inválido"),
  title: z.string().min(1, "Título obrigatório"),
  description: z
    .string()
    .min(1, "Descrição obrigatória")
    .max(255, "Descrição: máximo 255 caracteres"),
  status: ticketStatusSchema,
});

export type CreateTicketFormValues = z.infer<typeof createTicketFormSchema>;

export const updateTicketFormSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z
    .string()
    .min(1, "Descrição obrigatória")
    .max(255, "Descrição: máximo 255 caracteres"),
  status: ticketStatusSchema,
  updatedAt: z.string().min(1, "updatedAt em falta"),
});

export type UpdateTicketFormValues = z.infer<typeof updateTicketFormSchema>;
