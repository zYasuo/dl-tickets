"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { BuildSClientModalParams } from "@/features/clients/schemas/client-modal.schema";
import type { BuildSCreateClientFormParams } from "@/features/clients/schemas/client.schema";

export function useBuildSCreateClientFormParams(): BuildSCreateClientFormParams {
  const tc = useTranslations("validation.clients");
  return useMemo(
    () => ({
      nameRequired: tc("nameRequired"),
      address: {
        streetRequired: tc("streetRequired"),
        numberRequired: tc("numberRequired"),
        neighborhoodRequired: tc("neighborhoodRequired"),
        zipRequired: tc("zipRequired"),
        countryRequired: tc("countryRequired"),
        countryUuidInvalid: tc("countryUuidInvalid"),
        stateRequired: tc("stateRequired"),
        stateUuidInvalid: tc("stateUuidInvalid"),
        cityRequired: tc("cityRequired"),
        cityUuidInvalid: tc("cityUuidInvalid"),
      },
      identification: {
        cpfNotForForeign: tc("cpfNotForForeign"),
        cnpjRequiredForeign: tc("cnpjRequiredForeign"),
        cpfRequired: tc("cpfRequired"),
        cnpjRequired: tc("cnpjRequired"),
      },
    }),
    [tc],
  );
}

export function useBuildSClientModalParams(): BuildSClientModalParams {
  return useBuildSCreateClientFormParams();
}
