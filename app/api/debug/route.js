// Visit /api/debug to check if storage is working correctly.

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return Response.json({
      ok: false,
      error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in Vercel environment variables.",
    });
  }

  const BUCKET = "gamedata";

  // 1. Ensure bucket exists
  await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
    cache: "no-store",
  });

  // 2. Write a test file
  const writeRes = await fetch(`${url}/storage/v1/object/${BUCKET}/__debug__`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": "text/plain",
      "x-upsert": "true",
    },
    body: "ok",
    cache: "no-store",
  });

  if (!writeRes.ok) {
    const body = await writeRes.json().catch(() => ({}));
    return Response.json({ ok: false, step: "write", error: body });
  }

  // 3. Read it back
  const readRes = await fetch(`${url}/storage/v1/object/${BUCKET}/__debug__`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
    cache: "no-store",
  });

  if (!readRes.ok) {
    return Response.json({ ok: false, step: "read", status: readRes.status });
  }

  const val = await readRes.text();
  if (val !== "ok") {
    return Response.json({ ok: false, step: "verify", got: val });
  }

  return Response.json({ ok: true, message: "✅ Supabase Storage connected — reads and writes working!" });
}
