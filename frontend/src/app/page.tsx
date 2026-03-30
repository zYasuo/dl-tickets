import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/shared/components/ui/button-variants";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">DL Tickets</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Frontend Next.js com TanStack Query, formulários Zod/RHF e proxy para a API
          Nest em <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/v1</code>.
        </p>
      </div>
      <Link href="/tickets" className={cn(buttonVariants({ size: "lg" }))}>
        Ver tickets
      </Link>
    </div>
  );
}
