import { z } from "zod";

export const STicketStatus = z.enum(["OPEN", "IN_PROGRESS", "DONE"]);

export type BuildSCreateTicketParams = {
  titleRequired: string;
  descriptionRequired: string;
  descriptionMax: string;
};

export function buildSCreateTicket(params: BuildSCreateTicketParams) {
  return z.object({
    title: z.string().min(1, params.titleRequired),
    description: z
      .string()
      .min(1, params.descriptionRequired)
      .max(255, params.descriptionMax),
  });
}

export type CreateTicketFormBody = z.infer<ReturnType<typeof buildSCreateTicket>>;

export type BuildSUpdateTicketParams = BuildSCreateTicketParams & {
  updatedAtRequired: string;
};

export function buildSUpdateTicket(params: BuildSUpdateTicketParams) {
  return z.object({
    title: z.string().min(1, params.titleRequired),
    description: z
      .string()
      .min(1, params.descriptionRequired)
      .max(255, params.descriptionMax),
    status: STicketStatus,
    updatedAt: z.string().min(1, params.updatedAtRequired),
  });
}

export type UpdateTicketFormBody = z.infer<ReturnType<typeof buildSUpdateTicket>>;
