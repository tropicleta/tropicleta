import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';

type ScoreRow = { run_id: string; name: string; score: number; completed_at: Date | string };
const clean = (row: ScoreRow) => ({ id: row.run_id, name: row.name, score: Number(row.score), completedAt: new Date(row.completed_at).toISOString() });

export const rankingStore = {
  async list(limit: number) {
    const result = await getDb().execute<ScoreRow>(sql`SELECT run_id, name, score, completed_at FROM tropi_scores ORDER BY score DESC, completed_at ASC, run_id ASC LIMIT ${limit}`);
    return result.rows.map(clean);
  },
  async save(entry: { run_id: string; name: string; score: number; completed_at: string }) {
    await getDb().execute(sql`INSERT INTO tropi_scores (run_id, name, score, completed_at) VALUES (${entry.run_id}::uuid, ${entry.name}, ${entry.score}, ${entry.completed_at}::timestamptz) ON CONFLICT (run_id) DO NOTHING`);
    const result = await getDb().execute<ScoreRow>(sql`SELECT run_id, name, score, completed_at FROM tropi_scores WHERE run_id = ${entry.run_id}::uuid`);
    return clean(result.rows[0]);
  },
};
