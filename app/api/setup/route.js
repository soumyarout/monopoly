// One-time setup: creates the kv table and disables RLS in Supabase.
// Visit /api/setup after setting the env vars.

const SUPABASE_URL          = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY     = process.env.SUPABASE_ANON_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN; // personal access token

const SETUP_SQL = `
  CREATE TABLE IF NOT EXISTS kv (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  ALTER TABLE kv DISABLE ROW LEVEL SECURITY;
`.trim();

export async function GET() {
  // ── Check env vars ──────────────────────────────────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Response.json({
      ok: false,
      error: "SUPABASE_URL and SUPABASE_ANON_KEY are not set in environment variables.",
    });
  }

  // ── Check if table already works ───────────────────────────────────────────
  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/kv?limit=0`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  if (testRes.ok) {
    return Response.json({ ok: true, message: "✅ Table already exists and is accessible. You're all set!" });
  }

  // ── Table doesn't exist — try to auto-create it ────────────────────────────
  if (!SUPABASE_ACCESS_TOKEN) {
    return Response.json({
      ok: false,
      error: "Table does not exist yet and SUPABASE_ACCESS_TOKEN is not set.",
      howToFix: [
        "1. Go to https://supabase.com/dashboard/account/tokens",
        "2. Click 'Generate new token', name it anything",
        "3. Add it to Vercel env vars as SUPABASE_ACCESS_TOKEN",
        "4. Redeploy and visit /api/setup again",
      ],
      orRunManually: SETUP_SQL,
    });
  }

  // Extract project ref from URL: https://abcxyz.supabase.co → abcxyz
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    return Response.json({ ok: false, error: "Could not parse project ref from SUPABASE_URL." });
  }

  // Run setup SQL via Supabase Management API
  const createRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: SETUP_SQL }),
    }
  );

  if (createRes.ok) {
    return Response.json({
      ok: true,
      message: "✅ Table created and RLS disabled. Your game is ready to play!",
    });
  }

  const err = await createRes.json().catch(() => ({}));
  return Response.json({
    ok: false,
    error: "Auto-create failed — see details below.",
    details: err,
    fallback: "Run this manually in Supabase SQL Editor:",
    sql: SETUP_SQL,
  });
}
