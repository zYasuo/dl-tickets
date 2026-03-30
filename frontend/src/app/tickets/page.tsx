import Link from "next/link";
import { TicketsList } from "@/features/tickets/components/tickets-list";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/page-header";
import { buttonVariants } from "@/shared/components/ui/button-variants";

export default function TicketsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
      <PageHeader
        title="Tickets"
        description="GET /api/v1/tickets com paginação, números de página e filtro opcional por dia (createdAt, UTC)."
        actions={
          <Link href="/tickets/new" className={cn(buttonVariants())}>
            Novo ticket
          </Link>
        }
      />
      <TicketsList />
    </div>
  );
}
