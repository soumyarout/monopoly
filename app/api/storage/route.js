// In-memory store — works for local dev (all players on the same server process).
// For Vercel (serverless), set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// to get a shared persistent store across function invocations.
const localStore = new Map();

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function kvGet(key) {
  if (REDIS_URL && REDIS_TOKEN) {
    const res = await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", key]),
      cache: "no-store",
    });
    const data = await res.json();
    return data.result ?? null;
  }
  return localStore.get(key) ?? null;
}

async function kvSet(key, value) {
  if (REDIS_URL && REDIS_TOKEN) {
    await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      // Store for 2 hours then auto-expire
      body: JSON.stringify(["SET", key, value, "EX", "7200"]),
      cache: "no-store",
    });
  } else {
    localStore.set(key, value);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

  const value = await kvGet(key);
  return Response.json({ value });
}

export async function POST(request) {
  const body = await request.json();
  const { key, value } = body;
  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

  await kvSet(key, value);
  return Response.json({ ok: true });
}
