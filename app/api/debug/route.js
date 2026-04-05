// Visit /api/debug to check connection status.
// If something is broken it will tell you exactly why and how to fix it.

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return Response.json({
      ok: false,
      error: "SUPABASE_URL or SUPABASE_ANON_KEY not set in Vercel environment variables.",
    });
  }

  // 1. Check if table exists
  const tableRes = await fetch(`${url}/rest/v1/kv?limit=0`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!tableRes.ok) {
    const body = await tableRes.json().catch(() => ({}));
    return Response.json({
      ok: false,
      step: "table_check",
      error: body,
      fix: "Visit /api/setup to auto-create the table (needs SUPABASE_ACCESS_TOKEN env var) or run the SQL manually in Supabase SQL Editor.",
      sql: "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);\nALTER TABLE kv DISABLE ROW LEVEL SECURITY;",
    });
  }

  // 2. Try writing
  const writeRes = await fetch(`${url}/rest/v1/kv`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ key: "__debug__", value: "ok" }),
    cache: "no-store",
  });

  if (!writeRes.ok) {
    const body = await writeRes.json().catch(() => ({}));
    return Response.json({
      ok: false,
      step: "write",
      error: body,
      fix: "RLS is blocking writes. Visit /api/setup or run: ALTER TABLE kv DISABLE ROW LEVEL SECURITY;",
    });
  }

  // 3. Try reading back
  const readRes = await fetch(`${url}/rest/v1/kv?key=eq.__debug__&select=value`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const rows = await readRes.json().catch(() => []);

  if (!readRes.ok || !rows[0]?.value) {
    return Response.json({
      ok: false,
      step: "read",
      fix: "RLS is blocking reads. Run: ALTER TABLE kv DISABLE ROW LEVEL SECURITY;",
    });
  }

  return Response.json({ ok: true, message: "✅ Supabase connected, table works, reads and writes OK!" });
}
