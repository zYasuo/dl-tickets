"use client";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";

type AuthSubmitButtonProps = {
  pending: boolean;
  idleLabel: string;
  pendingLabel: string;
  className?: string;
};

export function AuthSubmitButton({
  pending,
  idleLabel,
  pendingLabel,
  className,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={cn("w-full", className)}
      disabled={pending}
    >
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
