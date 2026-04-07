import type { ClientPublic, CreateClientBody } from "@/features/clients/actions";
import type { ClientModalBody } from "@/features/clients/schemas/client-modal.schema";
import type { CreateClientFormBody } from "@/features/clients/schemas/client.schema";
import { DEFAULT_COUNTRY_UUID_BR } from "@/features/locations/constants";

function uuidFromApi(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

export function getCreateClientFormDefaultValues(): CreateClientFormBody {
  return {
    foreignNational: false,
    documentKind: "cpf",
    name: "",
    cpf: "",
    cnpj: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      zipCode: "",
      countryUuid: DEFAULT_COUNTRY_UUID_BR,
      stateUuid: "",
      cityUuid: "",
      stateDisplay: "",
      cityDisplay: "",
    },
  };
}

export function getClientModalDefaultValues(): ClientModalBody {
  return {
    ...getCreateClientFormDefaultValues(),
    personType: "fisica",
    icmsContributor: "contribuinte",
    active: true,
    sex: "nao_informar",
    birthDate: undefined,
    tipoClienteLookup: undefined,
    canalVendaLookup: undefined,
    filialLookup: undefined,
  };
}

function stringFromDoc(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function clientPublicToFormValues(
  client: ClientPublic,
): ClientModalBody {
  const cpf = stringFromDoc(client.cpf as unknown);
  const cnpj = stringFromDoc(client.cnpj as unknown);
  const hasCpf = cpf.trim().length > 0;

  return {
    foreignNational: false,
    documentKind: hasCpf ? "cpf" : "cnpj",
    name: client.name,
    cpf: hasCpf ? cpf : "",
    cnpj: hasCpf ? "" : cnpj,
    address: {
      street: client.address.street,
      number: client.address.number,
      complement: client.address.complement ?? "",
      neighborhood: client.address.neighborhood,
      zipCode: client.address.zipCode,
      countryUuid: DEFAULT_COUNTRY_UUID_BR,
      stateUuid: uuidFromApi(client.address.stateUuid),
      cityUuid: uuidFromApi(client.address.cityUuid),
      stateDisplay: client.address.state,
      cityDisplay: client.address.city,
    },
    personType: "fisica",
    icmsContributor: "contribuinte",
    active: true,
    sex: "nao_informar",
    birthDate: undefined,
    tipoClienteLookup: undefined,
    canalVendaLookup: undefined,
    filialLookup: undefined,
  };
}

export function clientFormToCreateBody(
  values: CreateClientFormBody,
): CreateClientBody {
  const comp = values.address.complement?.trim();
  const address = {
    street: values.address.street.trim(),
    number: values.address.number.trim(),
    neighborhood: values.address.neighborhood.trim(),
    zipCode: values.address.zipCode.trim(),
    stateUuid: values.address.stateUuid.trim(),
    cityUuid: values.address.cityUuid.trim(),
    ...(comp ? { complement: comp } : {}),
  };

  const isForeignNational = values.foreignNational;

  if (isForeignNational) {
    return {
      name: values.name.trim(),
      cnpj: values.cnpj!.trim(),
      address,
      isForeignNational: true,
    };
  }

  if (values.documentKind === "cpf") {
    return {
      name: values.name.trim(),
      cpf: values.cpf!.trim(),
      address,
      isForeignNational: false,
    };
  }

  return {
    name: values.name.trim(),
    cnpj: values.cnpj!.trim(),
    address,
    isForeignNational: false,
  };
}
