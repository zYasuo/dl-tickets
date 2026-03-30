import type { components } from "@/lib/api/v1";

export type StandardErrorBody = components["schemas"]["StandardErrorEnvelope"];

function formatMessage(message: string | string[]): string {
  return Array.isArray(message) ? message.join("\n") : message;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorTitle: string;
  readonly messageBody: string | string[];
  readonly details?: unknown;

  constructor(body: StandardErrorBody) {
    super(formatMessage(body.message));
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.errorTitle = body.error;
    this.messageBody = body.message;
    this.details = body.details;
  }

  static isStandardError(json: unknown): json is StandardErrorBody {
    if (!json || typeof json !== "object") return false;
    const o = json as Record<string, unknown>;
    return (
      o.success === false &&
      typeof o.statusCode === "number" &&
      typeof o.error === "string" &&
      (typeof o.message === "string" || Array.isArray(o.message))
    );
  }

  static fromUnknown(json: unknown, fallbackStatus: number): ApiError {
    if (ApiError.isStandardError(json)) {
      return new ApiError(json);
    }
    return new ApiError({
      success: false,
      timestamp: new Date().toISOString(),
      statusCode: fallbackStatus,
      error: "Error",
      message: "Pedido inválido ou servidor indisponível.",
    });
  }
}
