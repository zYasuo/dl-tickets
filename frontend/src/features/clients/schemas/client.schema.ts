import { z } from "zod";

const addressFormSchema = z.object({
  street: z.string().min(1, "Rua ou logradouro obrigatório"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z
    .string()
    .min(2, "UF com 2 letras")
    .max(2, "UF com 2 letras")
    .transform((s) => s.toUpperCase()),
  zipCode: z.string().min(1, "CEP obrigatório"),
});

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
  });

export type CreateClientFormValues = z.infer<typeof createClientFormSchema>;
