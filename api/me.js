import crypto from "node:crypto";
import { send, body, wrap } from "../lib/http.js";
import { getUserData, saveUserData } from "../lib/store.js";
import { requireUser, publicUser } from "../lib/auth.js";

const BREEDS = ["pastor", "srd", "malinois", "pitbull"];
const MAX_DOG_BYTES = 1_500_000;
const MAX_DOGS = 6;

const str = (v, n) => String(v ?? "").slice(0, n);
const img = (v, max) => (typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length <= max ? v : null);

function cleanDog(d, old = {}) {
  const dog = {
    id: old.id || crypto.randomUUID(),
    name: str(d.name, 30).trim() || "Meu cão",
    breed: BREEDS.includes(d.breed) ? d.breed : "srd",
    birth: /^\d{4}-\d{2}-\d{2}$/.test(d.birth || "") ? d.birth : "",
    sex: d.sex === "f" ? "f" : "m",
    weight: Math.max(0, Math.min(120, Number(d.weight) || 0)),
    neutered: !!d.neutered,
    notes: str(d.notes, 600),
    photo: d.photo === undefined ? old.photo || null : img(d.photo, 400_000),
    vaccineCard: d.vaccineCard === undefined ? old.vaccineCard || null : img(d.vaccineCard, 500_000),
    vaccines: (Array.isArray(d.vaccines) ? d.vaccines : []).slice(0, 40).map((v) => ({
      id: str(v.id, 40) || crypto.randomUUID(),
      name: str(v.name, 60),
      date: /^\d{4}-\d{2}-\d{2}$/.test(v.date || "") ? v.date : "",
      next: /^\d{4}-\d{2}-\d{2}$/.test(v.next || "") ? v.next : "",
      vet: str(v.vet, 60),
    })),
    progress: d.progress && typeof d.progress === "object" ? d.progress : old.progress || {},
    chat: (Array.isArray(d.chat) ? d.chat : old.chat || []).slice(-40).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: str(m.content, 6000), t: Number(m.t) || 0 })),
    createdAt: old.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  return dog;
}

export default wrap(async (req, res) => {
  const u = await requireUser(req);
  if (!u) return send(res, 401, { error: "Sessão expirada ou acesso não aprovado." });
  const data = await getUserData(u.id);
  data.dogs = data.dogs || [];

  if (req.method === "GET") {
    return send(res, 200, { user: publicUser(u), dogs: data.dogs, activeDogId: data.activeDogId || data.dogs[0]?.id || null });
  }
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido" });

  const b = await body(req);
  if (b.action === "saveDog") {
    if (!b.dog || typeof b.dog !== "object") return send(res, 400, { error: "Dados do cão faltando" });
    const idx = b.dog.id ? data.dogs.findIndex((d) => d.id === b.dog.id) : -1;
    if (idx < 0 && data.dogs.length >= MAX_DOGS) return send(res, 400, { error: `Máximo de ${MAX_DOGS} cães por conta.` });
    const dog = cleanDog(b.dog, idx >= 0 ? data.dogs[idx] : {});
    if (JSON.stringify(dog).length > MAX_DOG_BYTES) return send(res, 413, { error: "Dados grandes demais (fotos muito pesadas)." });
    if (idx >= 0) data.dogs[idx] = dog;
    else data.dogs.push(dog);
    if (!data.activeDogId || idx < 0) data.activeDogId = dog.id;
    await saveUserData(u.id, data);
    return send(res, 200, { ok: true, dog, activeDogId: data.activeDogId });
  }
  if (b.action === "setActive") {
    if (data.dogs.some((d) => d.id === b.id)) data.activeDogId = b.id;
    await saveUserData(u.id, data);
    return send(res, 200, { ok: true, activeDogId: data.activeDogId });
  }
  if (b.action === "deleteDog") {
    data.dogs = data.dogs.filter((d) => d.id !== b.id);
    if (data.activeDogId === b.id) data.activeDogId = data.dogs[0]?.id || null;
    await saveUserData(u.id, data);
    return send(res, 200, { ok: true, activeDogId: data.activeDogId });
  }
  return send(res, 400, { error: "Ação inválida" });
});
