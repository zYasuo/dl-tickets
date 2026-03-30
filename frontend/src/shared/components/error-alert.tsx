"use client";

import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { ApiError } from "@/lib/api/api-error";

type ErrorAlertProps = {
  error: unknown;
  title?: string;
  className?: string;
};

function messageFromUnknown(error: unknown): string {
  if (error instanceof ApiError) {
    return typeof error.messageBody === "string"
      ? error.messageBody
      : error.messageBody.join("\n");
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function ErrorAlert({ error, title = "Error", className }: ErrorAlertProps) {
  const description = messageFromUnknown(error);

  return (
    <Alert variant="destructive" className={className}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="whitespace-pre-wrap">{description}</AlertDescription>
    </Alert>
  );
}
