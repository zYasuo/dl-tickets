export function ticketCode(id: string): string {
  return `TKT-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
