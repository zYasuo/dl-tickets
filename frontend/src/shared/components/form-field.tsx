"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/shared/components/ui/label";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  labelTrailing?: ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  required,
  labelTrailing,
  children,
  className,
}: FormFieldProps) {
  const labelNode = (
    <Label htmlFor={htmlFor}>
      {label}
      {required ? <span className="text-destructive"> *</span> : null}
    </Label>
  );

  return (
    <div className={cn("grid gap-2", className)}>
      {labelTrailing ? (
        <div className="flex items-center justify-between gap-3">
          {labelNode}
          {labelTrailing}
        </div>
      ) : (
        labelNode
      )}
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
