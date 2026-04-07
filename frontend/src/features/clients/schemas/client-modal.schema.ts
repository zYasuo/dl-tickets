import { z } from "zod";

import {
  buildSAddressBody,
  refineClientIdentification,
  type BuildSAddressBodyParams,
  type ClientIdentificationMessages,
} from "@/features/clients/schemas/client.schema";

const lookupPairSchema = z
  .object({
    code: z.string(),
    label: z.string(),
  })
  .optional();

export type BuildSClientModalParams = {
  nameRequired: string;
  address: BuildSAddressBodyParams;
  identification: ClientIdentificationMessages;
};

export function buildSClientModal(params: BuildSClientModalParams) {
  return z
    .object({
      foreignNational: z.boolean(),
      documentKind: z.enum(["cpf", "cnpj"]),
      name: z.string().min(1, params.nameRequired).max(255),
      cpf: z.string().optional(),
      cnpj: z.string().optional(),
      address: buildSAddressBody(params.address),
      personType: z.enum(["fisica", "juridica"]),
      icmsContributor: z.enum(["contribuinte", "nao_contribuinte", "isento"]),
      active: z.boolean(),
      sex: z.enum(["masculino", "feminino", "nao_informar"]),
      birthDate: z.string().optional(),
      tipoClienteLookup: lookupPairSchema,
      canalVendaLookup: lookupPairSchema,
      filialLookup: lookupPairSchema,
    })
    .superRefine((data, ctx) => {
      refineClientIdentification(data, ctx, params.identification);
    });
}

export type ClientModalBody = z.infer<ReturnType<typeof buildSClientModal>>;
