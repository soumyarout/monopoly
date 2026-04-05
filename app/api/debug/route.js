// Visit /api/debug to check if Supabase is connected and the table is accessible
export async function GET() {
  const url   = process.env.SUPABASE_URL;
  const key   = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return Response.json({ ok: false, error: "SUPABASE_URL or SUPABASE_ANON_KEY not set" });
  }

  // 1. Try writing a test key
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
  const writeBody = await writeRes.json().catch(() => ({}));

  if (!writeRes.ok) {
    return Response.json({
      ok: false,
      step: "write",
      status: writeRes.status,
      error: writeBody,
      fix: "Run this in Supabase SQL Editor: ALTER TABLE kv DISABLE ROW LEVEL SECURITY;",
    });
  }

  // 2. Try reading it back
  const readRes = await fetch(
    `${url}/rest/v1/kv?key=eq.__debug__&select=value`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    }
  );
  const readBody = await readRes.json().catch(() => ({}));

  if (!readRes.ok || !Array.isArray(readBody) || readBody.length === 0) {
    return Response.json({
      ok: false,
      step: "read",
      status: readRes.status,
      error: readBody,
      fix: "Run this in Supabase SQL Editor: ALTER TABLE kv DISABLE ROW LEVEL SECURITY;",
    });
  }

  return Response.json({ ok: true, message: "Supabase is connected and working!" });
}
