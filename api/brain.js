// "Cérebro" da IA Guaipecas: o que ela aprende com todo mundo fica aqui (brain.json).
// - learn: quando a IA não entende e o tutor escolhe o tema certo, as palavras da frase viram sinônimos daquele tema.
// - vote: 👍/👎 nas respostas ajusta a confiança em cada tema.
// - miss: perguntas que ela não soube responder ficam pro admin ensinar.
// - admin: cria respostas novas (ensinamentos), apaga, e responde perguntas pendentes.
import crypto from "node:crypto";
import { send, body, wrap } from "../lib/http.js";
import { readJSON, writeJSON } from "../lib/store.js";
import { requireUser, requireAdmin } from "../lib/auth.js";

const EMPTY = { synonyms: {}, votes: {}, custom: [], misses: [] };
const STOP = new Set("a o os as um uma uns umas de da do das dos dele dela em no na nos nas por pra pro para com sem que se ele ela eu tu voce vc meu minha seu sua e ou mas mais muito muita isso essa esse este esta como quando onde qual quais porque pq por que ta tá to tô ja já nao não sim tem ter fica faz fazer ser estar sobre ai aí la lá aqui oi ola olá entao então tipo coisa cachorro cao cão dog".split(" "));

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tokens = (s) => [...new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.slice(0, 7)))].slice(0, 12);
const validId = (id) => typeof id === "string" && /^[a-z0-9_-]{2,40}$/.test(id);

async function load() {
  const b = await readJSON("brain", EMPTY);
  return { ...EMPTY, ...b };
}

export default wrap(async (req, res) => {
  const admin = requireAdmin(req);
  const user = admin ? null : await requireUser(req);
  if (!admin && !user) return send(res, 401, { error: "Sessão expirada." });

  const brain = await load();
  if (req.method === "GET") {
    const out = { synonyms: brain.synonyms, votes: brain.votes, custom: brain.custom };
    if (admin) out.misses = brain.misses;
    return send(res, 200, out);
  }
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido" });
  const b = await body(req);

  if (b.action === "learn" && validId(b.intent)) {
    const syn = (brain.synonyms[b.intent] ||= {});
    for (const t of tokens(b.phrase)) syn[t] = Math.min(20, (syn[t] || 0) + 1);
  } else if (b.action === "vote" && validId(b.intent)) {
    const v = (brain.votes[b.intent] ||= { up: 0, down: 0 });
    b.up ? v.up++ : v.down++;
  } else if (b.action === "miss") {
    const q = String(b.phrase || "").trim().slice(0, 300);
    if (q.length > 3) {
      brain.misses = brain.misses.filter((m) => norm(m.q) !== norm(q));
      brain.misses.unshift({ id: crypto.randomUUID(), q, breed: String(b.breed || "").slice(0, 12), t: Date.now() });
      brain.misses = brain.misses.slice(0, 150);
    }
  } else if (admin && b.action === "addCustom") {
    const q = String(b.q || "").trim().slice(0, 200);
    const a = String(b.a || "").trim().slice(0, 4000);
    const kw = tokens(q + " " + String(b.keywords || ""));
    if (!q || !a || !kw.length) return send(res, 400, { error: "Preenche a pergunta e a resposta." });
    const item = { id: "c" + crypto.randomBytes(5).toString("hex"), q, a, kw, breed: ["pastor", "srd", "malinois", "pitbull"].includes(b.breed) ? b.breed : "", t: Date.now() };
    brain.custom.unshift(item);
    if (b.missId) brain.misses = brain.misses.filter((m) => m.id !== b.missId);
  } else if (admin && b.action === "deleteCustom") {
    brain.custom = brain.custom.filter((c) => c.id !== b.id);
  } else if (admin && b.action === "dismissMiss") {
    brain.misses = brain.misses.filter((m) => m.id !== b.id);
  } else if (admin && b.action === "resetLearning") {
    brain.synonyms = {};
    brain.votes = {};
  } else {
    return send(res, 400, { error: "Ação inválida" });
  }
  await writeJSON("brain", brain);
  return send(res, 200, { ok: true });
});
