import Link from "next/link";
import { TicketCreateForm } from "@/features/tickets/components/ticket-create-form";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/page-header";
import { buttonVariants } from "@/shared/components/ui/button-variants";

export default function NewTicketPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 p-6">
      <PageHeader
        title="Criar ticket"
        description="POST /api/v1/tickets — validação com Zod + React Hook Form."
        actions={
          <Link href="/tickets" className={cn(buttonVariants({ variant: "outline" }))}>
            Voltar
          </Link>
        }
      />
      <TicketCreateForm />
    </div>
  );
}
