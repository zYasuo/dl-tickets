"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog as LocationStackedDialogRoot,
  DialogPortal,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/lib/utils";

export function LocationStackedDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogPrimitive.Backdrop
        data-slot="location-stacked-overlay"
        className="fixed inset-0 z-60 bg-black/50 duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute"
      />
      <DialogPrimitive.Viewport className="fixed inset-0 z-60 grid place-items-center p-4 sm:p-8">
        <DialogPrimitive.Popup
          data-slot="location-stacked-content"
          className={cn(
            "relative z-60 grid w-full max-w-2xl gap-4 rounded-xl border border-border bg-background p-6 text-foreground shadow-lg ring-1 ring-foreground/10 duration-100 outline-none data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0 sm:p-8",
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close
              data-slot="location-stacked-close"
              className="absolute inset-e-2 top-2 rounded-md opacity-70 outline-none ring-offset-background transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              render={<Button variant="ghost" size="icon" />}
            >
              <XIcon className="size-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPortal>
  );
}

export {
  LocationStackedDialogRoot,
  DialogTitle,
  DialogHeader,
  DialogDescription,
};
