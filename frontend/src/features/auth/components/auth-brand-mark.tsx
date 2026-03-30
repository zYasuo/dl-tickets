import Link from "next/link";
import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthBrandMarkProps = {
  href?: string;
  className?: string;
};

export function AuthBrandMark({ href, className }: AuthBrandMarkProps) {
  const inner = (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-muted-foreground",
        className,
      )}
    >
      <Ticket className="size-5" aria-hidden />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        DL Tickets
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex justify-center hover:text-primary">
        {inner}
      </Link>
    );
  }

  return inner;
}
