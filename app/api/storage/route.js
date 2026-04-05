import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Storage backend (auto-detected from env vars):
//
//  Vercel  → Supabase Storage (no SQL, no table, self-initialising)
//            Needs: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//            (both are on the same page: Supabase → Project Settings → API)
//
//  Local   → JSON file (game-data.json). Zero setup.

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET        = "gamedata";

// ── Supabase Storage (Vercel) ─────────────────────────────────────────────────

let bucketEnsured = false;

async function ensureBucket() {
  if (bucketEnsured) return;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
    cache: "no-store",
  });
  // ok = just created | 400 "already exists" = also fine
  bucketEnsured = true;
}

async function storageGet(key) {
  await ensureBucket();
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(key)}`,
    {
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  return await res.text();
}

async function storageSet(key, value) {
  await ensureBucket();
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": "text/plain",
        "x-upsert": "true",
      },
      body: value,
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[storage] storageSet error:", JSON.stringify(err));
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
  if (SUPABASE_URL && SERVICE_KEY) return storageGet(key);
  return fileGet(key);
}

async function kvSet(key, value) {
  if (SUPABASE_URL && SERVICE_KEY) return storageSet(key, value);
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
