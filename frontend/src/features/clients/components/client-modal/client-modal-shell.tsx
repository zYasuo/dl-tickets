"use client";

import * as React from "react";

import { ClientModalHeader } from "@/features/clients/components/client-modal/client-modal-header";
import { ClientModalToolbar } from "@/features/clients/components/client-modal/client-modal-toolbar";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { cn } from "@/lib/utils";

type ClientModalToolbarConfig = React.ComponentProps<typeof ClientModalToolbar>;

type ClientModalShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  onRequestClose: () => void;
  alert?: { title: string; description?: string } | null;
  toolbar: ClientModalToolbarConfig;
  children: React.ReactNode;
};

export function ClientModalShell({
  open,
  onOpenChange,
  expanded,
  onToggleExpand,
  onRequestClose,
  alert,
  toolbar,
  children,
}: ClientModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:rounded-xl",
          expanded
            ? "h-[90dvh] w-[min(96vw,1400px)] max-w-[min(96vw,1400px)]"
            : "w-[min(98vw,1320px)] max-w-[min(98vw,1320px)]",
        )}
        aria-describedby={undefined}
      >
        <DialogDescription className="sr-only">
          Formulário de cadastro ou edição de cliente com separadores.
        </DialogDescription>
        <ClientModalHeader
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          onClose={onRequestClose}
        />
        {alert ? (
          <div className="border-b border-border px-4 py-2">
            <Alert className="border-amber-500/40 bg-amber-500/10">
              <AlertTitle className="text-sm">{alert.title}</AlertTitle>
              {alert.description ? (
                <AlertDescription>{alert.description}</AlertDescription>
              ) : null}
            </Alert>
          </div>
        ) : null}
        <ClientModalToolbar {...toolbar} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
