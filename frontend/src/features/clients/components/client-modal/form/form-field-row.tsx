"use client";

import * as React from "react";
import { useId } from "react";
import { InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

import { RequiredMark } from "./required-mark";

export const clientFormRowGridClass =
  "grid gap-3 sm:grid-cols-[minmax(10rem,12.5rem)_minmax(0,1fr)] sm:gap-x-4 sm:items-start";

type FormFieldRowProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  infoTooltip?: string;
  className?: string;
  children: React.ReactNode;
};

export function FormFieldRow({
  label,
  htmlFor,
  required,
  error,
  hint,
  infoTooltip,
  className,
  children,
}: FormFieldRowProps) {
  const errId = useId();
  const hintId = useId();
  const describedBy =
    [hint ? hintId : null, error ? errId : null].filter(Boolean).join(" ") ||
    undefined;

  const controlChild = React.useMemo(() => {
    if (!React.isValidElement(children)) return children;
    const props = children.props as {
      id?: string;
      "aria-describedby"?: string;
      "aria-invalid"?: boolean;
    };
    const next: Record<string, unknown> = {};
    if (htmlFor && !props.id) next.id = htmlFor;
    if (describedBy) next["aria-describedby"] = describedBy;
    if (error) next["aria-invalid"] = true;
    if (Object.keys(next).length === 0) return children;
    return React.cloneElement(children, next);
  }, [children, describedBy, error, htmlFor]);

  return (
    <div className={cn(clientFormRowGridClass, className)}>
      <div className="flex items-start gap-1.5 pt-0.5 sm:pt-2.5">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-snug text-muted-foreground"
        >
          {label}
          {required ? (
            <>
              {" "}
              <RequiredMark />
            </>
          ) : null}
        </label>
        {infoTooltip ? (
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Informação: ${label}`}
            >
              <InfoIcon className="size-3.5" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {infoTooltip}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <div className="min-w-0 max-w-full space-y-1.5">
        {controlChild}
        {hint ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
