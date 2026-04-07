import { z } from "zod";

const schema = z
  .object({
    BACKEND_INTERNAL_URL: z.string().optional(),
    NEXT_PUBLIC_API_BASE_PATH: z
      .string()
      .min(1, "NEXT_PUBLIC_API_BASE_PATH is required"),
  })
  .transform((data) => {
    const raw = data.BACKEND_INTERNAL_URL?.trim();
    const backendInternalUrl =
      raw && raw.length > 0 ? raw.replace(/\/$/, "") : "http://localhost:3000";
    return {
      BACKEND_INTERNAL_URL: backendInternalUrl,
      NEXT_PUBLIC_API_BASE_PATH: data.NEXT_PUBLIC_API_BASE_PATH,
    };
  });

export type Env = z.output<typeof schema>;

export const env: Env = Object.freeze(schema.parse(process.env));
