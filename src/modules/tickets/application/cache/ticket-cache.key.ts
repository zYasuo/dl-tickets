export function ticketCacheKey(ticketId: string): string {
  return `tickets:${ticketId}`;
}
