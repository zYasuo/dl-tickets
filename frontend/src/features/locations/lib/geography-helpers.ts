import { z } from "zod";

export function sortCountriesByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

export function isUuidString(value: string): boolean {
  return z.uuid().safeParse(value.trim()).success;
}
