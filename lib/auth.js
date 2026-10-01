import crypto from "node:crypto";
import { getUsers } from "./store.js";

export const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "guaipecas2026";
const SECRET = process.env.SESSION_SECRET || crypto.createHash("sha256").update("guaipecas::" + ADMIN_PASSWORD).digest("hex");

export const usingDefaultAdmin = () => !process.env.ADMIN_PASSWORD;
export const usingDefaultSecret = () => !process.env.SESSION_SECRET;

export function hashPassword(pw, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(pw), salt, 64).toString("hex");
  return { salt, hash };
}
export function checkPassword(pw, salt, hash) {
  const h = crypto.scryptSync(String(pw), salt, 64);
  const ref = Buffer.from(hash, "hex");
  return ref.length === h.length && crypto.timingSafeEqual(h, ref);
}
function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
export function checkAdmin(user, pw) {
  return safeEqual(String(user || "").trim().toLowerCase(), ADMIN_USER.toLowerCase()) && safeEqual(pw || "", ADMIN_PASSWORD);
}

const b64u = (b) => Buffer.from(b).toString("base64url");
export function signToken(payload, days = 30) {
  const body = b64u(JSON.stringify({ ...payload, exp: Date.now() + days * 864e5 }));
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return body + "." + sig;
}
export function readToken(req) {
  const h = req.headers["authorization"] || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : "";
  const [body, sig] = tok.split(".");
  if (!body || !sig) return null;
  const good = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export function requireAdmin(req) {
  const t = readToken(req);
  return t && t.role === "admin" ? t : null;
}

// Usuário precisa estar aprovado AGORA (bloqueio vale na hora).
export async function requireUser(req) {
  const t = readToken(req);
  if (!t || t.role !== "user") return null;
  const users = await getUsers();
  const u = users.find((x) => x.id === t.uid);
  if (!u || u.status !== "approved") return null;
  return u;
}

export function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, status: u.status, createdAt: u.createdAt };
}
