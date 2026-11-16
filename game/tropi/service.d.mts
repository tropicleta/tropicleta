export function normalizeName(value: unknown): string;
export function createRankingService(options: {
  secret: string;
  store: { list(limit: number): Promise<unknown[]>; save(entry: {run_id: string; name: string; score: number; completed_at: string}): Promise<unknown> };
}): {
  list(): Promise<{entries: unknown[]}>;
  start(): unknown;
  advance(token: unknown, proof: unknown): unknown;
  submit(token: unknown, name: unknown): Promise<unknown>;
};
