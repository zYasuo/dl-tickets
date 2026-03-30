import Link from "next/link";
import { TicketEditForm } from "@/features/tickets/components/ticket-edit-form";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/page-header";
import { buttonVariants } from "@/shared/components/ui/button-variants";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTicketPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 p-6">
      <PageHeader
        title="Editar ticket"
        description="PATCH /api/v1/tickets/:id — envia updatedAt para controlo de concorrência."
        actions={
          <Link href="/tickets" className={cn(buttonVariants({ variant: "outline" }))}>
            Lista
          </Link>
        }
      />
      <TicketEditForm ticketId={id} />
    </div>
  );
}
