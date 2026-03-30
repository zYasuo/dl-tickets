import type { components } from "@/lib/api/v1";

type Status = components["schemas"]["TicketStatus"];

const labels: Record<Status, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em progresso",
  DONE: "Concluído",
};

export function ticketStatusLabel(status: Status): string {
  return labels[status];
}
