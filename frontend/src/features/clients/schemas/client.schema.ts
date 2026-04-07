import { z } from "zod";

export type BuildSAddressBodyParams = {
  streetRequired: string;
  numberRequired: string;
  neighborhoodRequired: string;
  zipRequired: string;
  stateRequired: string;
  stateUuidInvalid: string;
  cityRequired: string;
  cityUuidInvalid: string;
};

export function buildSAddressBody(params: BuildSAddressBodyParams) {
  return z.object({
    street: z.string().min(1, params.streetRequired),
    number: z.string().min(1, params.numberRequired),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, params.neighborhoodRequired),
    zipCode: z.string().min(1, params.zipRequired),
    countryUuid: z.uuid(),
    stateUuid: z
      .string()
      .min(1, params.stateRequired)
      .uuid(params.stateUuidInvalid),
    cityUuid: z
      .string()
      .min(1, params.cityRequired)
      .uuid(params.cityUuidInvalid),
    stateDisplay: z.string().optional(),
    cityDisplay: z.string().optional(),
  });
}

export type ClientIdentificationMessages = {
  cpfNotForForeign: string;
  cnpjRequiredForeign: string;
  cpfRequired: string;
  cnpjRequired: string;
};

export function refineClientIdentification(
  data: {
    foreignNational: boolean;
    documentKind: "cpf" | "cnpj";
    cpf?: string | undefined;
    cnpj?: string | undefined;
  },
  ctx: z.RefinementCtx,
  m: ClientIdentificationMessages,
): void {
  if (data.foreignNational) {
    if (data.cpf?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: m.cpfNotForForeign,
        path: ["cpf"],
      });
    }
    if (!data.cnpj?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: m.cnpjRequiredForeign,
        path: ["cnpj"],
      });
    }
    return;
  }
  if (data.documentKind === "cpf") {
    if (!data.cpf?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: m.cpfRequired,
        path: ["cpf"],
      });
    }
  } else if (!data.cnpj?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: m.cnpjRequired,
      path: ["cnpj"],
    });
  }
}

export type BuildSCreateClientFormParams = {
  nameRequired: string;
  address: BuildSAddressBodyParams;
  identification: ClientIdentificationMessages;
};

export function buildSCreateClientForm(params: BuildSCreateClientFormParams) {
  return z
    .object({
      foreignNational: z.boolean(),
      documentKind: z.enum(["cpf", "cnpj"]),
      name: z.string().min(1, params.nameRequired).max(255),
      cpf: z.string().optional(),
      cnpj: z.string().optional(),
      address: buildSAddressBody(params.address),
    })
    .superRefine((data, ctx) => {
      refineClientIdentification(data, ctx, params.identification);
    });
}

export type CreateClientFormBody = z.infer<
  ReturnType<typeof buildSCreateClientForm>
>;

export type AddressBody = z.infer<ReturnType<typeof buildSAddressBody>>;
