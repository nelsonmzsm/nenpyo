type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

function todayResetMs(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

export function checkRateLimit(
  identifier: string,
  key: string,
  limit: number
): { ok: boolean; remaining: number } {
  const mapKey = `${key}:${identifier.toLowerCase().trim()}`;
  const now = Date.now();
  const entry = store.get(mapKey);

  if (!entry || entry.resetAt < now) {
    store.set(mapKey, { count: 1, resetAt: todayResetMs() });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) return { ok: false, remaining: 0 };
  entry.count++;
  return { ok: true, remaining: limit - entry.count };
}
