import type { TicketPublic } from "@/lib/api/tickets-api";

type Status = TicketPublic["status"];

const labels: Record<Status, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em progresso",
  DONE: "Concluído",
};

export function ticketStatusLabel(status: Status): string {
  return labels[status];
}
