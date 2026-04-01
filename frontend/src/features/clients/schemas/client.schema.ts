import { z } from "zod";

export const addressFormSchema = z.object({
  street: z.string().min(1, "Rua ou logradouro obrigatório"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  zipCode: z.string().min(1, "CEP obrigatório"),
  countryUuid: z.uuid(),
  stateUuid: z
    .string()
    .min(1, "Estado obrigatório")
    .uuid("Indique um estado válido (UUID)"),
  cityUuid: z
    .string()
    .min(1, "Cidade obrigatória")
    .uuid("Indique uma cidade válida (UUID)"),
  stateDisplay: z.string().optional(),
  cityDisplay: z.string().optional(),
});

export function refineClientIdentification(
  data: {
    foreignNational: boolean
    documentKind: "cpf" | "cnpj"
    cpf?: string | undefined
    cnpj?: string | undefined
  },
  ctx: z.RefinementCtx,
): void {
  if (data.foreignNational) {
    if (data.cpf?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF não se aplica a cliente estrangeiro",
        path: ["cpf"],
      });
    }
    if (!data.cnpj?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CNPJ obrigatório",
        path: ["cnpj"],
      });
    }
    return;
  }
  if (data.documentKind === "cpf") {
    if (!data.cpf?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF obrigatório",
        path: ["cpf"],
      });
    }
  } else if (!data.cnpj?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CNPJ obrigatório",
      path: ["cnpj"],
    });
  }
}

export const createClientFormSchema = z
  .object({
    foreignNational: z.boolean(),
    documentKind: z.enum(["cpf", "cnpj"]),
    name: z.string().min(1, "Nome ou razão social obrigatório").max(255),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    address: addressFormSchema,
  })
  .superRefine((data, ctx) => {
    refineClientIdentification(data, ctx);
  });

export type CreateClientFormValues = z.infer<typeof createClientFormSchema>;

export type AddressFormValues = z.infer<typeof addressFormSchema>;
