"use client";

import { useTranslations } from "next-intl";
import { formatApiErrorForUser } from "@/lib/api/format-api-error-for-user";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";

type ErrorAlertProps = {
  error: unknown;
  title?: string;
  className?: string;
};

export function ErrorAlert({ error, title, className }: ErrorAlertProps) {
  const tCommon = useTranslations("common");
  const tApi = useTranslations("errors.api");
  const description = formatApiErrorForUser(error, tApi);

  return (
    <Alert variant="destructive" className={className}>
      <AlertTitle>{title ?? tCommon("errorTitle")}</AlertTitle>
      <AlertDescription className="whitespace-pre-wrap">{description}</AlertDescription>
    </Alert>
  );
}
