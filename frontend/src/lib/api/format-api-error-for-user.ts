import { ApiError } from "@/lib/api/api-error";
import { isRegisteredLocalizedApiErrorCode } from "@/lib/api/api-error-codes";

function formatMessageBody(message: string | string[]): string {
  return Array.isArray(message) ? message.join("\n") : message;
}

export type ApiErrorUserTranslator = (key: string) => string;

export function formatApiErrorForUser(
  error: unknown,
  t: ApiErrorUserTranslator,
): string {
  if (error instanceof ApiError) {
    if (
      error.code !== undefined &&
      isRegisteredLocalizedApiErrorCode(error.code)
    ) {
      return t(error.code);
    }
    return formatMessageBody(error.messageBody);
  }
  if (error instanceof Error) return error.message;
  return t("GENERIC");
}
