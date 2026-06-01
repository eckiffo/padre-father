/**
 * Lazy KV wrapper — avoids module-level crash when Vercel KV env vars aren't set.
 * Import this instead of '@vercel/kv' directly.
 */

let _kv = null;

async function getKv() {
  if (_kv) return _kv;
  try {
    const mod = await import('@vercel/kv');
    _kv = mod.kv;
  } catch (_) {
    _kv = null;
  }
  return _kv;
}

export async function kvGet(key)              { try { return await (await getKv())?.get(key) ?? null; }        catch (_) { return null; } }
export async function kvSet(key, val, opts)   { try { await (await getKv())?.set(key, val, opts); }           catch (_) {} }
export async function kvZadd(key, entry)      { try { await (await getKv())?.zadd(key, entry); }              catch (_) {} }
export async function kvZrange(key, a, b, o)  { try { return await (await getKv())?.zrange(key, a, b, o) ?? []; } catch (_) { return []; } }
export async function kvZcard(key)            { try { return await (await getKv())?.zcard(key) ?? 0; }        catch (_) { return 0; } }
export async function kvZscore(key, mem)      { try { return await (await getKv())?.zscore(key, mem) ?? null; } catch (_) { return null; } }
export async function kvZincrby(key, n, mem)  { try { await (await getKv())?.zincrby(key, n, mem); }          catch (_) {} }
export async function kvExpire(key, secs)     { try { await (await getKv())?.expire(key, secs); }             catch (_) {} }
export async function kvScard(key)            { try { return await (await getKv())?.scard(key) ?? 0; }        catch (_) { return 0; } }
export async function kvSadd(key, val)        { try { await (await getKv())?.sadd(key, val); }                catch (_) {} }
