import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Storage backend priority:
// 1. Supabase   — set SUPABASE_URL + SUPABASE_ANON_KEY  (free, no credit card)
//                 Run once in Supabase SQL editor:
//                   CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
// 2. JSON file  — local dev default, zero setup (saves to game-data.json)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// ── Supabase (Vercel / production) ────────────────────────────────────────────

async function supabaseGet(key) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/kv?key=eq.${encodeURIComponent(key)}&select=value`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );
  const body = await res.json();
  if (!res.ok) {
    console.error("[storage] supabaseGet error:", JSON.stringify(body));
    return null;
  }
  return body[0]?.value ?? null;
}

async function supabaseSet(key, value) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/kv`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ key, value }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("[storage] supabaseSet error:", JSON.stringify(body));
  }
}

// ── JSON file (local dev) ─────────────────────────────────────────────────────

const DATA_FILE = join(process.cwd(), "game-data.json");

function fileGet(key) {
  if (!existsSync(DATA_FILE)) return null;
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf8"))[key] ?? null;
  } catch { return null; }
}

function fileSet(key, value) {
  let data = {};
  if (existsSync(DATA_FILE)) {
    try { data = JSON.parse(readFileSync(DATA_FILE, "utf8")); } catch {}
  }
  data[key] = value;
  writeFileSync(DATA_FILE, JSON.stringify(data), "utf8");
}

// ── Public API ────────────────────────────────────────────────────────────────

async function kvGet(key) {
  if (SUPABASE_URL && SUPABASE_KEY) return supabaseGet(key);
  return fileGet(key);
}

async function kvSet(key, value) {
  if (SUPABASE_URL && SUPABASE_KEY) return supabaseSet(key, value);
  fileSet(key, value);
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function GET(request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });
  return Response.json({ value: await kvGet(key) });
}

export async function POST(request) {
  const { key, value } = await request.json();
  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });
  await kvSet(key, value);
  return Response.json({ ok: true });
}
