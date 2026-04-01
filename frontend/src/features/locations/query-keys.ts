const root = ["locations"] as const;

export const locationQueryKeys = {
  all: root,
  countries: [...root, "countries"] as const,
  states: (countryUuid: string) => [...root, "states", countryUuid] as const,
  cities: (stateUuid: string) => [...root, "cities", stateUuid] as const,
};
