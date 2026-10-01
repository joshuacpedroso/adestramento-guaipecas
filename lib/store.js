// Armazenamento em JSON.
// - Na Vercel com Blob conectado (BLOB_READ_WRITE_TOKEN): cada documento vira um arquivo .json privado no Blob.
// - Sem Blob: arquivos .json na pasta ./data (local) ou /tmp (Vercel, temporário — some a cada deploy/reinício).
import { promises as fs } from "node:fs";
import path from "node:path";

const PREFIX = "guaipecas/";
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = process.env.DATA_DIR || (process.env.VERCEL ? "/tmp/guaipecas-data" : path.join(process.cwd(), "data"));

export function storageMode() {
  if (useBlob) return { mode: "blob", persistent: true, label: "Vercel Blob (JSON privado)" };
  if (process.env.VERCEL) return { mode: "tmp", persistent: false, label: "Temporário (/tmp) — conecte o Vercel Blob!" };
  return { mode: "file", persistent: true, label: "Arquivos JSON em ./data" };
}

let blobMod = null;
async function blob() {
  if (!blobMod) blobMod = await import("@vercel/blob");
  return blobMod;
}

const safe = (key) => {
  if (!/^[a-z0-9/_-]+$/i.test(key)) throw new Error("chave inválida");
  return key;
};

export async function readJSON(key, fallback) {
  safe(key);
  if (useBlob) {
    const { get } = await blob();
    const r = await get(PREFIX + key + ".json", { access: "private", useCache: false });
    if (!r || !r.stream) return fallback;
    const txt = await new Response(r.stream).text();
    try { return JSON.parse(txt); } catch { return fallback; }
  }
  try {
    const txt = await fs.readFile(path.join(LOCAL_DIR, key + ".json"), "utf8");
    return JSON.parse(txt);
  } catch {
    return fallback;
  }
}

export async function writeJSON(key, value) {
  safe(key);
  const body = JSON.stringify(value);
  if (useBlob) {
    const { put } = await blob();
    await put(PREFIX + key + ".json", body, {
      access: "private",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return;
  }
  const file = path.join(LOCAL_DIR, key + ".json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + "." + process.pid + ".tmp";
  await fs.writeFile(tmp, body);
  await fs.rename(tmp, file);
}

export async function deleteJSON(key) {
  safe(key);
  if (useBlob) {
    const { del } = await blob();
    try { await del(PREFIX + key + ".json"); } catch { /* já não existe */ }
    return;
  }
  try { await fs.unlink(path.join(LOCAL_DIR, key + ".json")); } catch { /* já não existe */ }
}

// ---- domínio ----
export async function getUsers() {
  const db = await readJSON("users", { users: [] });
  return Array.isArray(db.users) ? db.users : [];
}
export async function saveUsers(users) {
  await writeJSON("users", { users, updatedAt: Date.now() });
}
export async function getUserData(uid) {
  return readJSON("u/" + uid, { dogs: [], activeDogId: null });
}
export async function saveUserData(uid, data) {
  await writeJSON("u/" + uid, data);
}
export async function deleteUserData(uid) {
  await deleteJSON("u/" + uid);
}
