(function () {
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem("gp-" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("gp-" + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("gp-" + k); } catch {} },
};
const dayKey = (d = new Date()) => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const fmtDate = (s) => { if (!s) return "—"; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------------- ícones ---------------- */
const IC = {
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  mat:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h10M7 14h6"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  ear:'<path d="M7 20c3 0 4-2 4-4 0-3 5-3 5-8a5 5 0 0 0-10 0"/><path d="M10 9a2 2 0 0 1 4 0"/>',
  click:'<rect x="5" y="6" width="14" height="14" rx="5"/><circle cx="12" cy="13" r="3"/>',
  tooth:'<path d="M7 3c-2 0-3 2-3 4 0 3 1 4 1.5 7S6 21 8 21s2-5 4-5 2 5 4 5 2-4 2.5-7S20 10 20 7c0-2-1-4-3-4s-3 1-5 1-3-1-5-1z"/>',
  sit:'<path d="M8 21v-5l-2-3 2-6 4-3 3 2v4l3 3v8"/><path d="M12 12v9"/>',
  come:'<path d="M5 12h12M12 6l6 6-6 6"/>',
  hand:'<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 16l-1-3a1.5 1.5 0 0 1 2.7-1.2L8 15"/>',
  alone:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  down:'<path d="M3 17h18M5 17l2-5h6l4 2 3 3"/><circle cx="7" cy="10" r="2"/>',
  stay:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  leave:'<circle cx="12" cy="12" r="9"/><path d="M5.5 5.5l13 13"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  door:'<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18"/><circle cx="15" cy="12" r="1"/>',
  people:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0M14 20a4.5 4.5 0 0 1 8 0"/>',
  leash:'<circle cx="6" cy="6" r="3"/><path d="M8.5 8L19 19M16 21l5-5"/>',
  walk:'<circle cx="13" cy="4" r="2"/><path d="M11 21l2-6-3-3 1-5 3 3h3M7 12l2-5"/>',
  drop:'<path d="M12 3l3 5-3 3-3-3z"/><path d="M5 14h14l-2 7H7z"/>',
  jump:'<path d="M12 21V11M8 15l4-4 4 4"/><circle cx="12" cy="5" r="2"/>',
  paw:'<ellipse cx="12" cy="16" rx="4.5" ry="3.8"/><ellipse cx="6" cy="10" rx="1.8" ry="2.4"/><ellipse cx="10" cy="6.5" rx="1.8" ry="2.4"/><ellipse cx="14" cy="6.5" rx="1.8" ry="2.4"/><ellipse cx="18" cy="10" rx="1.8" ry="2.4"/>',
  bark:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 8a5 5 0 0 1 0 8M20 5a9 9 0 0 1 0 14"/>',
  bone:'<path d="M7 14l7-7M5.5 17.5a2 2 0 1 1-1-3.4 2 2 0 1 1 3.4-1l6-6a2 2 0 1 1 1-3.4 2 2 0 1 1 3.4 1 2 2 0 1 1-1 3.4l-6 6a2 2 0 1 1-3.4 1 2 2 0 1 1-2.4 2.4z"/>',
  nose:'<path d="M12 4c4 0 7 3 7 7 0 3-2 5-4 6l-1 3h-4l-1-3c-2-1-4-3-4-6 0-4 3-7 7-7z"/><path d="M10 12h.01M14 12h.01"/>',
  rope:'<path d="M4 20c4-4 4-12 8-12s4 8 8 4"/><circle cx="4" cy="20" r="1.5"/><circle cx="20" cy="12" r="1.5"/>',
  calm:'<path d="M3 15h18M6 15c0-3 2.7-5 6-5s6 2 6 5"/><path d="M9 7l1-2M15 7l-1-2M12 6V3"/>',
  muzzle:'<path d="M5 8h14v7a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><path d="M9 8v12M15 8v12M5 13h14"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  bed:'<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 14h18M3 18v2M21 18v2"/><circle cx="8" cy="11.5" r="1.5"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6v4H9z"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
};
const icon = (n, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IC[n] || IC.paw}</svg>`;
const PAWF = `<svg viewBox="0 0 24 24" fill="currentColor">${IC.paw.replace(/ry="2.4"/g, 'ry="2.5"')}</svg>`;

/* ---------------- estado ---------------- */
const S = {
  token: LS.get("token", null), role: null, user: null, dogs: [], activeDogId: null,
  brain: LS.get("brain", { synonyms: {}, votes: {}, custom: [] }),
  sound: LS.get("sound", true), vibe: LS.get("vibe", true), tab: "trilha",
};
const dog = () => S.dogs.find((d) => d.id === S.activeDogId) || S.dogs[0] || null;
function P() {
  const d = dog(); if (!d) return null;
  const p = (d.progress ||= {});
  p.xp ||= 0; p.lessons ||= {}; p.exams ||= {}; p.logs ||= []; p.days ||= []; p.clicks ||= { total: 0, byDay: {} };
  p.missions ||= {}; p.missionsDone ||= 0; p.badges ||= []; p.ai ||= { mem: {}, syn: {}, asked: 0, byDay: {}, last: null };
  p.ai.mem ||= {}; p.ai.syn ||= {}; p.ai.byDay ||= {}; p.pottyInt ||= null;
  return p;
}
const LP = (id) => { const p = P(); return (p.lessons[id] ||= { sessions: [], steps: [], checks: [], done: false }); };

/* ---------------- API ---------------- */
async function api(path, opts = {}) {
  const r = await fetch("/api/" + path, {
    method: opts.body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(S.token ? { Authorization: "Bearer " + S.token } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = {};
  try { data = await r.json(); } catch {}
  if (!r.ok) { const e = new Error(data.error || "Falha na conexão"); e.status = r.status; e.data = data; throw e; }
  return data;
}

/* ---------------- utilidades de UI ---------------- */
function show(id) { $$(".screen").forEach((s) => s.classList.toggle("on", s.id === id)); window.scrollTo(0, 0); }
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2400); }
function buzz(p) { if (S.vibe && navigator.vibrate) try { navigator.vibrate(p); } catch {} }
function formErr(form, msg) { const e = $("[data-err]", form); e.textContent = msg || ""; e.classList.toggle("hidden", !msg); }
function openSheet(html, after) { $("#sheetBody").innerHTML = html; $("#sheet").classList.add("on"); document.body.style.overflow = "hidden"; $("#sheet .card").scrollTop = 0; after && after(); }
function closeSheet() { $("#sheet").classList.remove("on"); document.body.style.overflow = ""; stopSession(); }
$$("[data-close]").forEach((x) => x.addEventListener("click", closeSheet));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

let actx = null;
function clickSound() {
  if (!S.sound) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = "square"; o.frequency.setValueAtTime(2600, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.03);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.06);
  } catch {}
}
function beep() { if (!S.sound) return; try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); const t = actx.currentTime; [0, 0.18, 0.36].forEach((d) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.25, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.15); o.connect(g).connect(actx.destination); o.start(t + d); o.stop(t + d + 0.16); }); } catch {} }

function confetti(n = 40) {
  const box = $("#confetti"), cols = ["#0B8071", "#E31B26", "#E8A33A", "#5E4BB6", "#2E7AA8"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "vw"; c.style.background = cols[i % cols.length];
    c.style.animationDuration = 1.6 + Math.random() * 1.6 + "s"; c.style.animationDelay = Math.random() * 0.3 + "s";
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(c); setTimeout(() => c.remove(), 3600);
  }
}
function xpFloat(n, el) {
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
  const f = document.createElement("div"); f.className = "xpfloat"; f.textContent = "+" + n + " XP";
  f.style.left = r.left + r.width / 2 - 30 + "px"; f.style.top = r.top - 10 + "px";
  document.body.appendChild(f); setTimeout(() => f.remove(), 1000);
}
function celebrate({ e = "🏆", title, text = "", xp = 0, ok = "Bora!", then }) {
  $("#celeE").textContent = e; $("#celeTitle").textContent = title; $("#celeText").textContent = text;
  $("#celeXp").textContent = "+" + xp + " XP"; $("#celeXp").classList.toggle("hidden", !xp);
  $("#celeOk").textContent = ok; $("#celebrate").classList.add("on"); confetti(46); buzz([30, 40, 60]);
  $("#celeOk").onclick = () => { $("#celebrate").classList.remove("on"); then && setTimeout(then, 150); };
}

/* ---------------- fotos ---------------- */
function compressImage(file, max = 520, maxLen = 380_000) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      let { width: w, height: h } = img; const k = Math.min(1, max / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      let q = 0.82, out = cv.toDataURL("image/jpeg", q);
      while (out.length > maxLen && q > 0.3) { q -= 0.12; out = cv.toDataURL("image/jpeg", q); }
      res(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Imagem inválida")); };
    img.src = url;
  });
}

/* ---------------- sessão / boot ---------------- */
async function boot() {
  applyTheme();
  if (!S.token) return show("s-auth");
  try {
    const me = await api("auth");
    if (me.role === "admin") { S.role = "admin"; return openAdmin(); }
    S.role = "user"; S.user = me.user;
    if (me.status !== "approved") return showPending(me.status);
    await loadMe();
  } catch (e) {
    if (e.status === 401) return logout();
    const cache = LS.get("me", null);
    if (cache) { Object.assign(S, cache); S.role = "user"; toast("Sem internet: usando dados salvos no aparelho"); enterApp(); }
    else { show("s-auth"); toast(e.message); }
  }
}
function logout() { S.token = null; LS.del("token"); LS.del("me"); S.dogs = []; S.user = null; S.role = null; show("s-auth"); }
$$("[data-logout]").forEach((b) => b.addEventListener("click", logout));

function showPending(status) {
  const T = { pending: ["Cadastro em análise", "⏳", "Assim que o admin aprovar, teu acesso é liberado. Pode fechar o app e voltar depois."], rejected: ["Cadastro não aprovado", "🚫", "Teu cadastro não foi aprovado. Fala com a Adestramento Guaipecas."], blocked: ["Acesso bloqueado", "🔒", "Teu acesso tá bloqueado. Fala com a Adestramento Guaipecas."] }[status] || ["Aguardando", "⏳", ""];
  $("#pendTitle").textContent = T[0]; $(".pending .big").textContent = T[1]; $("#pendText").textContent = T[2];
  $("#pendCheck").classList.toggle("hidden", status !== "pending");
  show("s-pending");
}
$("#pendCheck").onclick = async () => { $("#pendCheck").disabled = true; try { await boot(); if ($("#s-pending").classList.contains("on")) toast("Ainda em análise. Volta mais tarde! 🐾"); } finally { $("#pendCheck").disabled = false; } };

async function loadMe() {
  const me = await api("me");
  S.user = me.user; S.dogs = me.dogs || []; S.activeDogId = me.activeDogId;
  cacheMe();
  api("brain").then((b) => { S.brain = b; LS.set("brain", b); }).catch(() => {});
  if (!S.dogs.length) return openDogForm(null, true);
  enterApp();
}
function cacheMe() { try { LS.set("me", { user: S.user, dogs: S.dogs.map((d) => ({ ...d, vaccineCard: null })), activeDogId: S.activeDogId }); } catch {} }

/* auth forms */
$$("[data-auth]").forEach((b) => b.addEventListener("click", () => {
  $$("[data-auth]").forEach((x) => x.classList.toggle("on", x === b));
  $("#f-login").classList.toggle("hidden", b.dataset.auth !== "login");
  $("#f-register").classList.toggle("hidden", b.dataset.auth !== "register");
}));
$("#f-login").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.target, btn = $("button[type=submit]", f); formErr(f); btn.disabled = true;
  try {
    const r = await api("auth", { body: { action: "login", login: f.login.value, password: f.password.value } });
    S.token = r.token; LS.set("token", r.token); f.reset();
    if (r.role === "admin") { S.role = "admin"; return openAdmin(); }
    S.role = "user"; S.user = r.user;
    if (r.status !== "approved") return showPending(r.status);
    await loadMe();
  } catch (err) { formErr(f, err.message); } finally { btn.disabled = false; }
});
$("#f-register").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.target, btn = $("button[type=submit]", f); formErr(f); btn.disabled = true;
  try {
    const r = await api("auth", { body: { action: "register", name: f.name.value, email: f.email.value, phone: f.phone.value, password: f.password.value } });
    S.token = r.token; LS.set("token", r.token); S.user = r.user; f.reset(); showPending("pending");
  } catch (err) { formErr(f, err.message); } finally { btn.disabled = false; }
});
$("#f-register").phone.addEventListener("input", (e) => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 11);
  e.target.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
});

/* ---------------- salvar progresso ---------------- */
let saveT = null, saving = false, dirty = false;
function save(now) {
  dirty = true; cacheMe(); clearTimeout(saveT);
  saveT = setTimeout(flush, now ? 0 : 1200);
}
async function flush() {
  if (saving || !dirty) return; const d = dog(); if (!d) return;
  saving = true; dirty = false;
  const { photo, vaccineCard, ...rest } = d;
  try { await api("me", { body: { action: "saveDog", dog: rest } }); }
  catch (e) { dirty = true; if (e.status === 401) return logout(); setTimeout(flush, 8000); }
  finally { saving = false; if (dirty) save(); }
}
window.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && dirty) flush(); });

/* ---------------- cadastro do cão ---------------- */
let dogDraft = null;
function openDogForm(d, first) {
  dogDraft = d ? { ...d } : { breed: "", sex: "m", photo: null };
  const f = $("#f-dog"); f.reset(); formErr(f);
  $("#dogFormTitle").textContent = d ? "Editar perfil" : first ? "Cadastrar meu cão" : "Novo cão";
  $("#dogSave").textContent = d ? "Salvar" : "Salvar e começar";
  $("#dogBack").classList.toggle("hidden", !!first);
  $("#dogDelete").classList.toggle("hidden", !d);
  if (d) { f.name.value = d.name; f.birth.value = d.birth || ""; f.weight.value = d.weight || ""; f.neutered.checked = !!d.neutered; f.notes.value = d.notes || ""; }
  f.birth.max = dayKey();
  renderBreedPick(); renderSex(); renderPhotoPrev();
  show("s-dog");
}
function renderBreedPick() {
  $("#breedPick").innerHTML = Object.entries(BREEDS).map(([k, b]) => `<button type="button" data-breed="${k}" class="${dogDraft.breed === k ? "on" : ""}"><span class="bd" style="background:${b.color}"></span><b>${esc(b.name)}</b><small>Energia ${esc(b.energy.toLowerCase())} · ${esc(b.size.split(" (")[0].toLowerCase())}</small></button>`).join("");
  $$("#breedPick button").forEach((b) => b.onclick = () => { dogDraft.breed = b.dataset.breed; renderBreedPick(); buzz(10); });
}
function renderSex() { $$("#sexSeg button").forEach((b) => { b.classList.toggle("on", b.dataset.sex === dogDraft.sex); b.onclick = () => { dogDraft.sex = b.dataset.sex; renderSex(); }; }); }
function renderPhotoPrev() { const el = $("#dogPhotoPrev"); el.style.backgroundImage = dogDraft.photo ? `url(${dogDraft.photo})` : ""; el.textContent = dogDraft.photo ? "" : "🐶"; }
$("#dogPhotoIn").addEventListener("change", async (e) => {
  const file = e.target.files[0]; if (!file) return;
  try { dogDraft.photo = await compressImage(file); renderPhotoPrev(); } catch { toast("Não consegui ler essa foto"); }
  e.target.value = "";
});
$("#dogBack").onclick = () => { if (S.dogs.length) { show("s-app"); } };
$("#f-dog").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.target, btn = $("#dogSave"); formErr(f);
  if (!dogDraft.breed) return formErr(f, "Escolhe a raça do teu cão.");
  if (!f.birth.value) return formErr(f, "Coloca a data de nascimento (pode ser aproximada).");
  const payload = { ...(dogDraft.id ? S.dogs.find((x) => x.id === dogDraft.id) : {}), name: f.name.value.trim(), breed: dogDraft.breed, birth: f.birth.value, sex: dogDraft.sex, weight: f.weight.value, neutered: f.neutered.checked, notes: f.notes.value, photo: dogDraft.photo || null };
  if (!payload.id) { delete payload.vaccineCard; payload.vaccines = []; payload.progress = {}; payload.chat = []; }
  btn.disabled = true;
  try {
    const r = await api("me", { body: { action: "saveDog", dog: payload } });
    const i = S.dogs.findIndex((x) => x.id === r.dog.id);
    if (i >= 0) S.dogs[i] = r.dog; else S.dogs.push(r.dog);
    S.activeDogId = r.activeDogId; cacheMe();
    toast(i >= 0 ? "Perfil salvo ✓" : `Bora treinar, ${r.dog.name}! 🐾`);
    enterApp(i >= 0 ? "cao" : "trilha");
  } catch (err) { formErr(f, err.message); } finally { btn.disabled = false; }
});
$("#dogDelete").onclick = async () => {
  const d = dogDraft; if (!d || !confirm(`Excluir ${d.name} e todo o progresso dele? Não dá pra desfazer.`)) return;
  try {
    const r = await api("me", { body: { action: "deleteDog", id: d.id } });
    S.dogs = S.dogs.filter((x) => x.id !== d.id); S.activeDogId = r.activeDogId; cacheMe();
    if (!S.dogs.length) return openDogForm(null, true);
    enterApp("cao");
  } catch (e) { toast(e.message); }
};

/* ---------------- caminho (trilha) ---------------- */
function ageMonths(d) { if (!d.birth) return 99; return (Date.now() - new Date(d.birth + "T12:00:00")) / 864e5 / 30.4; }
function buildPath() {
  const d = dog(), puppy = ageMonths(d) < 6;
  return WORLDS.map((w, wi) => {
    let lessons = w.breed ? BREED_LESSONS[d.breed] || [] : w.lessons;
    lessons = lessons.map((l) => (!puppy && l.adult ? { ...l, ...l.adult } : l));
    const wname = w.breed ? `Especial ${BREEDS[d.breed].short}` : w.name;
    const color = w.breed ? BREEDS[d.breed].color : w.color;
    const exam = { id: "x_" + w.id, t: "Prova: " + wname, ic: "trophy", k: "x", min: "5 min", checks: EXAMS[w.id], world: w.id };
    const nodes = [...lessons, exam].map((l) => ({ ...l, wi, color, wname }));
    return { ...w, name: wname, color, wi, nodes };
  });
}
let PATH = [];
const flatNodes = () => PATH.flatMap((w) => w.nodes);
const worldUnlocked = (wi) => wi === 0 || !!(P().exams[PATH[wi - 1].id] && P().exams[PATH[wi - 1].id].done);
const nodeDone = (n) => n.k === "x" ? !!(P().exams[n.world] && P().exams[n.world].done) : !!LP(n.id).done;
function nodeStatus(n) {
  if (nodeDone(n)) return "done";
  if (!worldUnlocked(n.wi)) return "lock";
  if (n.k === "x") return PATH[n.wi].nodes.filter((x) => x.k !== "x").every(nodeDone) ? "open" : "lock";
  return "open";
}
function currentNode() { return flatNodes().find((n) => nodeStatus(n) === "open") || null; }

/* ---------------- XP, níveis, medalhas ---------------- */
function rankOf(xp) { let r = RANKS[0], next = null; for (let i = 0; i < RANKS.length; i++) { if (xp >= RANKS[i].xp) { r = RANKS[i]; next = RANKS[i + 1] || null; } } return { r, next }; }
function addXP(n, el) {
  const p = P(), before = rankOf(p.xp).r; p.xp += n; markActive(); if (el !== false) xpFloat(n, el);
  const after = rankOf(p.xp).r;
  if (after !== before) setTimeout(() => celebrate({ e: "⭐", title: "Subiu de nível!", text: `${dog().name} agora é: ${after.t}`, ok: "Show!" }), 600);
}
function markActive() { const p = P(), k = dayKey(); if (!p.days.includes(k)) { p.days.push(k); p.days = p.days.slice(-200); } }
function streak() { const p = P(); let n = 0; const d = new Date(); if (!p.days.includes(dayKey(d))) d.setDate(d.getDate() - 1); while (p.days.includes(dayKey(d))) { n++; d.setDate(d.getDate() - 1); } return n; }
function sessionsOn(k) { let n = 0; for (const l of Object.values(P().lessons)) n += (l.sessions || []).filter((s) => s.d === k).length; return n; }
function totalSessions() { let n = 0; for (const l of Object.values(P().lessons)) n += (l.sessions || []).length; return n; }
function vaxState(v) { if (!v.next) return "ok"; const days = (new Date(v.next + "T12:00:00") - Date.now()) / 864e5; return days < 0 ? "late" : days <= 30 ? "soon" : "ok"; }
function checkBadges() {
  const p = P(), d = dog(), have = new Set(p.badges), got = [];
  const give = (id, cond) => { if (cond && !have.has(id)) { have.add(id); got.push(id); } };
  give("first", totalSessions() > 0);
  give("lesson1", Object.values(p.lessons).some((l) => l.done));
  ["w1", "w2", "w3", "w4", "w5", "w6"].forEach((w) => give(w, p.exams[w] && p.exams[w].done));
  const st = streak(); give("streak3", st >= 3); give("streak7", st >= 7);
  give("clicks100", p.clicks.total >= 100); give("clicks1000", p.clicks.total >= 1000);
  give("missions10", p.missionsDone >= 10);
  give("vax", (d.vaccines || []).length >= 2 && (d.vaccines || []).every((v) => vaxState(v) !== "late"));
  give("ask5", p.ai.asked >= 5);
  if (got.length) {
    p.badges = [...have];
    const b = BADGES.find((x) => x.id === got[got.length - 1]);
    setTimeout(() => { if (!$("#celebrate").classList.contains("on")) celebrate({ e: b.ic, title: "Medalha: " + b.t, text: b.d, xp: 0, ok: "Valeu!" }); else toast(`🏅 Medalha: ${b.t}`); }, 900);
  }
}

/* ---------------- missões do dia ---------------- */
function todayMissions() {
  const d = dog(), k = dayKey(), h = hash(k + d.id);
  const auto = MISSIONS.filter((m) => !m.manual), man = MISSIONS.filter((m) => m.manual);
  const a1 = auto[h % auto.length]; let a2 = auto[(h >>> 4) % auto.length];
  if (a2.metric === a1.metric) a2 = auto[(auto.indexOf(a1) + 3) % auto.length];
  const m1 = man[(h >>> 8) % man.length];
  return [a1, a2, m1];
}
function missionValue(m) {
  const p = P(), k = dayKey(), today = p.logs.filter((l) => dayKey(l.t) === k);
  if (m.manual) return (p.missions[k]?.manual || []).includes(m.id) ? 1 : 0;
  if (m.metric === "sessions") return sessionsOn(k);
  if (m.metric === "clicks") return p.clicks.byDay[k] || 0;
  if (m.metric === "chat") return p.ai.byDay[k] || 0;
  if (m.metric === "log:good") return today.filter((l) => l.k === "xixi" || l.k === "coco").length;
  if (m.metric.startsWith("log:")) return today.filter((l) => l.k === m.metric.slice(4)).length;
  return 0;
}
function checkMissions(silent) {
  const p = P(), k = dayKey(); const md = (p.missions[k] ||= { manual: [], awarded: [] });
  for (const m of todayMissions()) {
    const goal = m.manual ? 1 : m.goal;
    if (missionValue(m) >= goal && !md.awarded.includes(m.id)) {
      md.awarded.push(m.id); p.missionsDone++; addXP(m.xp, false);
      if (!silent) toast(`🎯 Missão completa: ${m.t} (+${m.xp} XP)`);
      buzz([20, 30, 20]);
    }
  }
  // limpa dias antigos
  const keys = Object.keys(p.missions).sort(); while (keys.length > 14) delete p.missions[keys.shift()];
}

/* ---------------- render: header ---------------- */
function renderHeader() {
  const d = dog(), p = P(), B = BREEDS[d.breed];
  const av = $("#hAvatar"); av.style.backgroundImage = d.photo ? `url(${d.photo})` : ""; av.textContent = d.photo ? "" : "🐶";
  $("#hName").textContent = d.name;
  const m = ageMonths(d), age = m < 3.7 ? Math.floor(m * 4.35) + " semanas" : m < 24 ? Math.floor(m) + " meses" : Math.floor(m / 12) + " anos";
  $("#hSub").textContent = `${B.name} · ${age}`;
  $("#hStreak").textContent = "🔥 " + streak();
  $("#hXp").textContent = "⭐ " + p.xp;
  $("#iaDog").textContent = d.name;
  $("#clickSess").textContent = B.session;
  const late = (d.vaccines || []).some((v) => vaxState(v) !== "ok");
  $("#vaxDot").classList.toggle("hidden", !late);
  document.title = `${d.name} · Adestramento Guaipecas`;
}

/* ---------------- render: trilha ---------------- */
function renderTrilha() {
  PATH = buildPath();
  const d = dog(), p = P(), cur = currentNode();
  const all = flatNodes(), done = all.filter(nodeDone).length, pct = Math.round((done / all.length) * 100);
  const { r, next } = rankOf(p.xp), rp = next ? Math.round(((p.xp - r.xp) / (next.xp - r.xp)) * 100) : 100;
  const hero = $("#hero");
  hero.style.background = cur ? `linear-gradient(135deg, ${cur.color}, ${shade(cur.color, -28)})` : "";
  if (!cur) {
    hero.innerHTML = `<p class="k">Trilha completa</p><h2>${esc(d.name)} é fera! 🏆</h2><p>Revisa os comandos 5 min por dia em lugares diferentes pra ele nunca esquecer.</p><div class="bar"><i style="width:100%"></i></div><div class="rank">⭐ ${esc(r.t)}</div><div class="paw">${PAWF}</div>`;
  } else {
    const st = cur.k === "x" ? `${(p.exams[cur.world]?.checks || []).length}/${cur.checks.length} testes` : cur.k === "c" ? `${LP(cur.id).checks.length}/${cur.checks.length} itens` : `${LP(cur.id).sessions.length}/${cur.n} sessões`;
    hero.innerHTML = `<p class="k">Treino de hoje · ${esc(cur.wname)} · ${st}</p><h2>${esc(cur.t)}</h2><p>${esc((cur.why || "Mostra tudo que ele aprendeu nesse mundo e libera o próximo!").split(". ")[0])}.</p>
      <div class="bar" aria-label="Progresso da trilha"><i style="width:${pct}%"></i></div>
      <div class="row" style="justify-content:space-between"><button class="btn light" data-open="${cur.id}">${LP(cur.id).sessions?.length || LP(cur.id).checks?.length ? "Continuar" : "Começar"}</button><span style="font-weight:800;opacity:.95">${pct}% da trilha</span></div>
      <div class="rank" style="margin-top:12px"><span>⭐ ${esc(r.t)}</span><div class="bar"><i style="width:${rp}%"></i></div><span>${next ? next.xp - p.xp + " XP" : "MAX"}</span></div>
      <div class="paw">${PAWF}</div>`;
  }
  renderMissions();
  const off = [0, 64, 0, -64]; let html = "";
  PATH.forEach((w, wi) => {
    const unl = worldUnlocked(wi), ld = w.nodes.filter(nodeDone).length;
    html += `<div class="world ${unl ? "" : "locked"}" style="--wc:${w.color}"><div class="world-head" style="background:${w.color}"><div><div class="wn">Mundo ${wi + 1}</div><h3>${esc(w.name)}</h3><p>${unl ? esc(w.desc) : "🔒 Passa na prova do mundo anterior pra liberar"}</p></div><span class="count">${ld}/${w.nodes.length}</span></div><div class="trail">`;
    w.nodes.forEach((n, j) => {
      const st = nodeStatus(n), isCur = cur && cur.id === n.id;
      const ic = st === "done" ? icon("check", 3) : st === "lock" ? icon("lock") : icon(n.ic);
      const s = n.k === "x" ? null : LP(n.id);
      const sub = st === "done" ? (n.k === "x" ? "Aprovado!" : "Aprendido") : st === "lock" ? (n.k === "x" ? "Termina as lições" : "") : n.k === "x" ? `${(P().exams[n.world]?.checks || []).length}/${n.checks.length}` : n.k === "c" ? `${s.checks.length}/${n.checks.length} itens` : `${s.sessions.length}/${n.n} sessões`;
      if (j > 0) html += `<div class="steps-paws" style="transform:translateX(${(off[j % 4] + off[(j - 1) % 4]) / 2}px)">${PAWF}${PAWF}</div>`;
      html += `<div class="node ${st === "open" ? "" : st} ${isCur ? "cur" : ""} ${n.k === "x" ? "exam" : ""}" style="transform:translateX(${off[j % 4]}px)">${isCur ? `<span class="start-tag">${n.k === "x" ? "PROVA!" : "AGORA"}</span>` : ""}<button class="dot" data-open="${n.id}" aria-label="${esc(n.t)}">${ic}</button><div class="lbl">${esc(n.t)}</div><div class="sub">${esc(sub)}</div></div>`;
    });
    html += `</div></div>`;
  });
  $("#path").innerHTML = html;
}
function shade(hex, pct) { const n = parseInt(hex.slice(1), 16); const f = (c) => Math.max(0, Math.min(255, Math.round(c + (pct / 100) * 255))); return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((x) => x.toString(16).padStart(2, "0")).join(""); }

function renderMissions() {
  const k = dayKey(), md = P().missions[k] || { manual: [], awarded: [] };
  const ms = todayMissions(), doneN = ms.filter((m) => md.awarded.includes(m.id)).length;
  $("#missions").innerHTML = `<div class="panel-head"><h3>🎯 Missões do dia</h3><span class="chip">${doneN}/3</span></div>` + ms.map((m) => {
    const goal = m.manual ? 1 : m.goal, v = Math.min(goal, missionValue(m)), ok = md.awarded.includes(m.id);
    return `<div class="m ${ok ? "ok" : ""}"><div class="mi">${m.ic}</div><div class="mt">${esc(m.t)}<small>+${m.xp} XP${m.manual ? " · marca quando fizer" : ` · ${v}/${goal}`}</small>${m.manual ? "" : `<div class="mb"><i style="width:${(v / goal) * 100}%"></i></div>`}</div>${m.manual ? `<button class="mcheck" data-mission="${m.id}" aria-label="Marcar missão">${ok ? icon("check", 3) : ""}</button>` : ok ? `<span class="mcheck">${icon("check", 3)}</span>` : ""}</div>`;
  }).join("");
}
document.addEventListener("click", (e) => {
  const mb = e.target.closest("[data-mission]"); if (!mb) return;
  const p = P(), k = dayKey(), md = (p.missions[k] ||= { manual: [], awarded: [] });
  if (md.awarded.includes(mb.dataset.mission)) return toast("Missão já completa ✓");
  md.manual.push(mb.dataset.mission); xpFloat(MISSIONS.find((m) => m.id === mb.dataset.mission).xp, mb);
  checkMissions(); checkBadges(); save(); renderAll();
});

/* abrir nó */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-open]"); if (!b) return;
  const n = flatNodes().find((x) => x.id === b.dataset.open); if (!n) return;
  if (nodeStatus(n) === "lock") {
    toast(n.k === "x" ? "Termina todas as lições desse mundo pra liberar a prova" : `Passa na prova do Mundo ${n.wi} pra liberar`);
    b.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-7px)" }, { transform: "translateX(7px)" }, { transform: "translateX(0)" }], { duration: 300 });
    buzz(40); return;
  }
  openNode(n.id);
});

/* ---------------- lição ---------------- */
let openId = null, sess = null;
function openNode(id) { openId = id; openSheet("", renderNode); }
function renderNode() {
  const n = flatNodes().find((x) => x.id === openId); if (!n) return;
  const d = dog(), B = BREEDS[d.breed];
  let h = `<div class="lhead" style="--wc:${n.color}"><div class="big">${icon(n.ic)}</div><div><h2>${esc(n.t)}</h2><p>Mundo ${n.wi + 1} · ${esc(n.wname)} · ${esc(n.min || "")}</p></div></div>`;
  if (n.k === "x") {
    const ex = (P().exams[n.world] ||= { checks: [], done: false });
    h += `<p class="why">Hora da prova! Testa cada item com o ${esc(d.name)}. Quando ele passar em tudo, o próximo mundo é liberado. Sem pressa: pode fazer em dias diferentes.</p>
      <div class="panel"><h3>Testes</h3><ul class="stepl checks">${n.checks.map((x, k) => `<li class="${ex.checks.includes(k) ? "ok" : ""}" data-xk="${k}"><span class="box"></span><span>${esc(x)}</span></li>`).join("")}</ul>
      ${ex.done ? `<p style="margin:10px 0 0;font-weight:800;color:var(--teal-d)">Aprovado ✓</p>` : `<button class="btn gold block" id="examPass" style="margin-top:12px" ${ex.checks.length >= n.checks.length ? "" : "disabled"}>🏆 Passou na prova!</button>`}</div>
      <div class="tip good"><b>Dica</b>Se algum item travar, volta na lição dele e faz mais umas sessões. A prova é pra ti ter certeza, não pra ter pressa.</div>`;
    $("#sheetBody").innerHTML = h;
    $$("[data-xk]").forEach((li) => li.onclick = () => { const k = +li.dataset.xk, i = ex.checks.indexOf(k); i < 0 ? ex.checks.push(k) : ex.checks.splice(i, 1); buzz(10); save(); renderNode(); });
    const pass = $("#examPass"); if (pass) pass.onclick = () => passExam(n);
    return;
  }
  const s = LP(n.id);
  h += `<p class="why">${esc(n.why)}</p>`;
  if (n.br && n.br[d.breed]) h += `<div class="breedtip"><b>🐕 Pro ${esc(B.short)}</b>${esc(n.br[d.breed])}</div>`;
  if (n.k === "p") {
    const doneSteps = s.steps.length;
    h += `<div class="panel"><div class="panel-head"><h3>Passo a passo</h3><span class="chip">${doneSteps}/${n.steps.length}</span></div>
      <p class="muted small" style="margin-top:-4px">Toca na etapa quando ele dominar ela.</p>
      <ul class="stepl">${n.steps.map((x, k) => `<li class="${s.steps.includes(k) ? "ok" : ""}" data-st="${k}"><span class="box"></span><span>${esc(x)}</span></li>`).join("")}</ul></div>`;
    if (n.ok) h += `<div class="criteria"><span class="e">✅</span><div><b>Passa de fase quando:</b> ${esc(n.ok)}</div></div>`;
    h += `<div class="panel"><div class="panel-head"><h3>Sessões de treino</h3><span class="chip">${s.sessions.length}/${n.n}</span></div>
      <p class="muted small" style="margin:0">${esc(n.session || `Sessões de ${B.session} min (ideal pro ${B.short}). Pode ser em dias diferentes.`)}</p>
      <div class="sessdots">${Array.from({ length: n.n }, (_, k) => `<i class="${k < s.sessions.length ? "f" : ""}">${k < s.sessions.length ? "✓" : k + 1}</i>`).join("")}</div>
      <div class="sessbox" id="sessbox">
        <div class="row"><div class="grow"><div class="clock" id="sClock">${B.session}:00</div><div class="small" style="opacity:.75">Para antes se ele cansar</div></div><button class="miniclick" id="sClick" aria-label="Clicker">click</button></div>
        <div class="reps"><button class="hit" id="sHit"><b id="sHitN">0</b>Acertou</button><button class="miss" id="sMiss"><b id="sMissN">0</b>Errou</button></div>
        <button class="btn main block" id="sEnd" style="margin-top:12px">Terminar sessão</button>
      </div>
      ${n.id === "banheiro" ? `<button class="btn main block" id="sQuick">✓ Segui a rotina hoje</button>` : `<button class="btn gold block" id="sStart">▶ Iniciar sessão</button>`}
      ${s.sessions.length ? `<ul class="histl">${s.sessions.slice(-4).reverse().map((x) => `<li><span>${fmtDate(x.d)}</span><span>${x.hits + x.miss ? Math.round((x.hits / (x.hits + x.miss)) * 100) + "% acerto · " : ""}${x.dur ? Math.max(1, Math.round(x.dur / 60)) + " min" : ""}</span></li>`).join("")}</ul>` : ""}
      ${finishBlock(n, s)}</div>`;
    if (n.probs && n.probs.length) h += `<div class="panel"><h3>Travou? Problemas comuns</h3>${n.probs.map(([q, a]) => `<details class="prob"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`;
  } else {
    h += `<div class="panel"><div class="panel-head"><h3>Checklist</h3><span class="chip">${s.checks.length}/${n.checks.length}</span></div><ul class="stepl checks">${n.checks.map((x, k) => `<li class="${s.checks.includes(k) ? "ok" : ""}" data-ck="${k}"><span class="box"></span><span>${esc(x)}</span></li>`).join("")}</ul>
      ${s.done ? `<p style="margin:10px 0 0;font-weight:800;color:var(--teal-d)">Concluído ✓</p>` : `<button class="btn main block" id="finish" style="margin-top:12px" ${s.checks.length >= n.checks.length ? "" : "disabled"}>Tudo feito! Concluir</button>`}</div>`;
  }
  h += `<div class="tip good"><b>💡 Dica</b>${esc(n.tip)}</div><div class="tip bad"><b>🚫 Evita</b>${esc(n.avoid)}</div>
    <button class="btn soft block" id="askAi" style="margin-top:6px">💬 Tô com dificuldade nessa lição</button>`;
  $("#sheetBody").innerHTML = h;

  $$("[data-st]").forEach((li) => li.onclick = () => { const k = +li.dataset.st, i = s.steps.indexOf(k); if (i < 0) { s.steps.push(k); addXP(5, li); } else s.steps.splice(i, 1); buzz(10); save(); renderNode(); renderTrilha(); renderHeader(); });
  $$("[data-ck]").forEach((li) => li.onclick = () => { const k = +li.dataset.ck, i = s.checks.indexOf(k); if (i < 0) { s.checks.push(k); addXP(5, li); } else s.checks.splice(i, 1); buzz(10); save(); renderNode(); renderTrilha(); renderHeader(); });
  const st = $("#sStart"); if (st) st.onclick = startSession;
  const q = $("#sQuick"); if (q) q.onclick = () => { if (s.sessions.some((x) => x.d === dayKey())) return toast("Hoje já tá registrado ✓"); s.sessions.push({ d: dayKey(), dur: 0, hits: 0, miss: 0 }); addXP(20, q); afterSession(n, s); };
  const fi = $("#finish"); if (fi) fi.onclick = () => finishLesson(n);
  $("#askAi").onclick = () => { closeSheet(); goTab("ia"); sendChat(`Tô com dificuldade na lição ${n.t}`); };
}
function finishBlock(n, s) {
  if (s.done) return `<p style="margin:10px 0 0;font-weight:800;color:var(--teal-d)">Aprendido ✓ Pode continuar revisando.</p>`;
  const needS = Math.max(0, n.n - s.sessions.length), needSt = n.steps.length - s.steps.length;
  const ready = needS === 0 && needSt === 0;
  return `<button class="btn main block" id="finish" style="margin-top:12px" ${ready ? "" : "disabled"}>🎓 Ele aprendeu! Concluir lição</button>${ready ? "" : `<p class="muted tiny center" style="margin:6px 0 0">Falta ${[needS && `${needS} sessão(ões)`, needSt && `marcar ${needSt} etapa(s)`].filter(Boolean).join(" e ")}</p>`}`;
}
function startSession() {
  const n = flatNodes().find((x) => x.id === openId), mins = BREEDS[dog().breed].session;
  sess = { left: mins * 60, start: Date.now(), hits: 0, miss: 0, timer: null, ended: false };
  $("#sessbox").classList.add("on"); $("#sStart").classList.add("hidden");
  const tick = () => { const el = $("#sClock"); if (!el) return stopSession(); const l = Math.max(0, sess.left); el.textContent = Math.floor(l / 60) + ":" + String(l % 60).padStart(2, "0"); if (sess.left === 0) { el.textContent = "Fim! 🎉"; beep(); buzz([100, 60, 100]); } sess.left--; };
  tick(); sess.timer = setInterval(tick, 1000);
  $("#sClick").onpointerdown = (e) => { e.preventDefault(); doClick($("#sClick")); };
  $("#sHit").onclick = () => { sess.hits++; $("#sHitN").textContent = sess.hits; buzz(12); };
  $("#sMiss").onclick = () => { sess.miss++; $("#sMissN").textContent = sess.miss; buzz(6); };
  $("#sEnd").onclick = () => {
    const s = LP(n.id), dur = Math.round((Date.now() - sess.start) / 1000);
    if (dur < 20 && sess.hits + sess.miss === 0) { stopSession(); renderNode(); return toast("Sessão muito curta, não contou"); }
    s.sessions.push({ d: dayKey(), dur, hits: sess.hits, miss: sess.miss });
    const acc = sess.hits + sess.miss ? sess.hits / (sess.hits + sess.miss) : 0;
    stopSession(); addXP(acc >= 0.8 ? 30 : 20, $("#sessbox"));
    if (acc >= 0.8) toast(`🔥 ${Math.round(acc * 100)}% de acerto! +10 XP bônus`);
    else if (sess && acc && acc < 0.5) toast("Muitos erros? Facilita uma etapa na próxima.");
    afterSession(n, s);
  };
}
function stopSession() { if (sess) { clearInterval(sess.timer); sess = null; } }
function afterSession(n, s) {
  markActive(); checkMissions(); checkBadges(); save();
  if (!s.done && s.sessions.length >= n.n && s.steps.length < n.steps.length) toast("Sessões completas! Marca as etapas que ele já domina 👆");
  else if (!s.done && s.sessions.length >= n.n) toast("Sessões completas! Pode concluir a lição 🎉");
  else toast("Sessão registrada 👏");
  confetti(10); renderNode(); renderAll();
}
function finishLesson(n) {
  const s = LP(n.id); s.done = true; s.doneAt = Date.now(); addXP(100, false); markActive(); checkBadges(); save(true); closeSheet(); renderAll();
  const nx = currentNode();
  celebrate({ e: "🎓", title: `${n.t}: aprendido!`, text: nx ? `Próximo: ${nx.t}` : `${dog().name} completou a trilha toda!`, xp: 100, ok: nx ? "Bora pra próxima" : "Valeu!", then: () => nx && openNode(nx.id) });
}
function passExam(n) {
  const ex = P().exams[n.world]; ex.done = true; ex.at = Date.now(); addXP(250, false); checkBadges(); save(true); closeSheet(); renderAll();
  const next = PATH[n.wi + 1];
  celebrate({ e: "🏆", title: "Prova aprovada!", text: next ? `Mundo ${n.wi + 2} liberado: ${next.name}` : "Trilha completa. O teu cão é um Cão Guaipecas!", xp: 250, ok: next ? "Explorar o novo mundo" : "Que orgulho!", then: () => { goTab("trilha"); const nx = currentNode(); nx && setTimeout(() => $(`[data-open="${nx.id}"].dot`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 200); } });
}

/* ---------------- clicker ---------------- */
let clickSessN = 0;
function doClick(el) {
  clickSound(); buzz(8); el.classList.add("p"); setTimeout(() => el.classList.remove("p"), 90);
  const p = P(), k = dayKey(); p.clicks.total++; p.clicks.byDay[k] = (p.clicks.byDay[k] || 0) + 1;
  const keys = Object.keys(p.clicks.byDay).sort(); while (keys.length > 30) delete p.clicks.byDay[keys.shift()];
  clickSessN++; $("#clickCount").textContent = clickSessN; $("#clickTotal").textContent = p.clicks.total;
  markActive(); clearTimeout(doClick.t); doClick.t = setTimeout(() => { checkMissions(); checkBadges(); save(); renderHeader(); }, 700);
}
$("#bigClicker").addEventListener("pointerdown", (e) => { e.preventDefault(); doClick($("#bigClicker")); });
$("#bigClicker").addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); doClick($("#bigClicker")); } });
$("#resetClicks").onclick = () => { clickSessN = 0; $("#clickCount").textContent = 0; };

/* ---------------- rotina ---------------- */
function defaultInt() { return ageMonths(dog()) < 4 ? 60 : ageMonths(dog()) < 7 ? 120 : 240; }
function renderRotina() {
  const p = P(), k = dayKey(), today = p.logs.filter((l) => dayKey(l.t) === k);
  $("#pottyInt").value = String(p.pottyInt || defaultInt());
  $("#logBtns").innerHTML = LOGS.map((l) => `<button class="logb ${l.cls}" data-log="${l.k}"><span class="e">${l.e}</span>${esc(l.label)}</button>`).join("");
  $("#stGood").textContent = today.filter((l) => l.k === "xixi" || l.k === "coco").length;
  $("#stBad").textContent = today.filter((l) => l.k === "acidente").length;
  $("#stSess").textContent = sessionsOn(k);
  const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
  const vals = days.map((d) => sessionsOn(dayKey(d))), max = Math.max(3, ...vals);
  $("#week").innerHTML = days.map((d, i) => `<div class="d ${i === 6 ? "today" : ""}"><div class="b" style="height:${(vals[i] / max) * 80 + 4}%;${vals[i] ? "" : "background:var(--line)"}" title="${vals[i]} treinos"></div><span>${"DSTQQSS"[d.getDay()]}</span></div>`).join("");
  $("#evlist").innerHTML = today.length ? today.slice().reverse().map((l) => { const L = LOGS.find((x) => x.k === l.k) || { e: "•", label: l.k }; const t = new Date(l.t); return `<li><span class="tm">${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}</span><span>${L.e} ${esc(L.label)}</span><button class="del" data-dellog="${l.t}" aria-label="Apagar">×</button></li>`; }).join("") : `<li class="muted">Nada registrado hoje ainda.</li>`;
  tickPotty();
}
function tickPotty() {
  const p = P(); if (!p) return;
  const last = p.logs.filter((l) => LOGS.find((x) => x.k === l.k)?.potty).slice(-1)[0];
  const int = (p.pottyInt || defaultInt()) * 60000, arc = $("#ringArc");
  if (!last) { $("#pottyClock").textContent = "--"; $("#pottyUnit").textContent = "min"; arc.style.strokeDashoffset = 0; $("#pottyHint").textContent = "Registra o primeiro xixi pra começar a contar."; return; }
  const left = last.t + int - Date.now(), frac = Math.max(0, Math.min(1, left / int));
  arc.style.strokeDashoffset = 326.7 * (1 - frac); arc.style.stroke = left < 0 ? "var(--red)" : left < 600000 ? "var(--gold)" : "var(--teal)";
  if (left <= 0) { $("#pottyClock").textContent = "Já!"; $("#pottyUnit").textContent = "agora"; $("#pottyTitle").textContent = "Hora de levar no xixi!"; $("#pottyHint").textContent = "Leva ele no lugar certo e espera 2–3 minutos."; }
  else { const m = Math.ceil(left / 60000); $("#pottyClock").textContent = m >= 60 ? Math.floor(m / 60) + "h" + String(m % 60).padStart(2, "0") : m; $("#pottyUnit").textContent = m >= 60 ? "" : "min"; $("#pottyTitle").textContent = "Próxima ida ao xixi"; $("#pottyHint").textContent = `Último registro às ${new Date(last.t).toTimeString().slice(0, 5)}.`; }
}
setInterval(() => { if (S.tab === "rotina" && dog()) tickPotty(); }, 20000);
$("#pottyInt").onchange = (e) => { P().pottyInt = +e.target.value; save(); tickPotty(); };
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-log]");
  if (b) { const p = P(); p.logs.push({ k: b.dataset.log, t: Date.now() }); p.logs = p.logs.slice(-400); markActive(); buzz(15); const L = LOGS.find((x) => x.k === b.dataset.log); if (L.good) { addXP(5, b); toast(`${L.e} Boa! Festa e petisco pra ele`); } else toast(`${L.e} Registrado`); checkMissions(); checkBadges(); save(); renderRotina(); renderHeader(); return; }
  const dl = e.target.closest("[data-dellog]");
  if (dl) { const p = P(); p.logs = p.logs.filter((l) => String(l.t) !== dl.dataset.dellog); save(); renderRotina(); }
});

/* ---------------- IA Guaipecas ---------------- */
const QUICK = ["Morde muito", "Puxa na guia", "Chora quando saio", "Late demais", "Xixi fora do lugar", "Pula nas pessoas", "Tem medo de fogos", "Quanto exercício?", "O que tu sabe dele?"];
function md(text) {
  const lines = esc(text).split("\n"); let out = "", list = null;
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  for (const ln of lines) {
    const o = ln.match(/^\s*(\d+)\.\s+(.*)/), u = ln.match(/^\s*[-•]\s+(.*)/);
    if (o) { if (list !== "ol") { close(); out += "<ol>"; list = "ol"; } out += `<li>${inline(o[2])}</li>`; }
    else if (u) { if (list !== "ul") { close(); out += "<ul>"; list = "ul"; } out += `<li>${inline(u[1])}</li>`; }
    else if (!ln.trim()) close();
    else { close(); out += `<p>${inline(ln)}</p>`; }
  }
  close(); return out;
}
function aiIntents() {
  const d = dog(); if (!PATH.length) PATH = buildPath();
  const lessons = PATH.flatMap((w) => w.nodes).filter((n) => n.k !== "x");
  const custom = GuaiBrain.custom((S.brain.custom || []).filter((c) => !c.breed || c.breed === d.breed));
  return [...custom, ...GuaiBrain.intents, ...GuaiBrain.lessonIntents(lessons)];
}
function aiCtx() { const c = GuaiBrain.ctxFor(dog()); const cur = currentNode(); c.current = cur && { t: cur.t, why: cur.why || "Prova do mundo: testa tudo que ele aprendeu.", world: cur.wname }; return c; }
function renderChat() {
  const d = dog(), p = P();
  $("#qchips").innerHTML = [currentNode() && `Dificuldade em: ${currentNode().t}`, ...QUICK].filter(Boolean).map((q) => `<button class="qchip" data-q="${esc(q)}">${esc(q)}</button>`).join("");
  const mem = GuaiBrain.memLines(GuaiBrain.ctxFor(d));
  $("#memTags").innerHTML = mem.length ? `<span>🧠 Lembro:</span>` + mem.map((m) => `<span>${esc(m)}</span>`).join("") : "";
  const chat = d.chat || [];
  if (!chat.length) {
    $("#chat").innerHTML = `<div class="msg a">${md(`Fala! Sou a **IA Guaipecas** 🐾 Já sei que o ${d.name} é ${BREEDS[d.breed].name} e tô por dentro da trilha dele.\n\nMe conta o que tá difícil — quanto mais detalhe (onde, quando, o que acontece antes), melhor eu te ensino. Também pode me contar coisas dele (ex: *"moramos em apartamento"*, *"ele tem medo de moto"*) que eu guardo.`)}</div>`;
    return;
  }
  $("#chat").innerHTML = chat.map((m, i) => m.role === "note" ? `<div class="memnote">${esc(m.content)}</div>` : m.role === "user" ? `<div class="msg u">${esc(m.content)}</div>` : `<div class="msg a">${md(m.content)}${m.opts ? `<div class="opts">${m.opts.map((o) => `<button data-pick="${esc(o.id)}" data-mi="${i}" class="${o.id === "_none" ? "no" : ""}">${esc(o.t)}</button>`).join("")}</div>` : ""}${m.intent && !m.opts ? `<div class="fb"><button data-fb="up" data-mi="${i}" class="${m.fb === "up" ? "on" : ""}">👍 Ajudou</button><button data-fb="down" data-mi="${i}" class="${m.fb === "down" ? "on" : ""}">👎 Não ajudou</button>${m.deep ? `<button data-fb="deep" data-mi="${i}">🔎 Mais detalhes</button>` : ""}</div>` : ""}</div>`).join("");
}
function pushMsg(m) { const d = dog(); d.chat ||= []; d.chat.push({ ...m, t: Date.now() }); if (d.chat.length > 60) d.chat = d.chat.slice(-60); }
let thinking = false;
function sendChat(text) {
  text = String(text || "").trim(); if (!text || thinking) return;
  const d = dog(), p = P();
  pushMsg({ role: "user", content: text });
  const learned = GuaiBrain.learnFacts(text, p.ai.mem);
  if (learned.length) pushMsg({ role: "note", content: "🧠 Anotei: " + learned.join(" · ") });
  p.ai.asked++; const k = dayKey(); p.ai.byDay[k] = (p.ai.byDay[k] || 0) + 1;
  const keys = Object.keys(p.ai.byDay).sort(); while (keys.length > 30) delete p.ai.byDay[keys.shift()];
  renderChat(); scrollChat(); thinking = true;
  const typing = document.createElement("div"); typing.className = "msg a"; typing.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`; $("#chat").appendChild(typing); scrollChat();
  setTimeout(() => {
    typing.remove(); thinking = false;
    pushMsg(answer(text, learned));
    checkMissions(); checkBadges(); save(); renderChat(); scrollChat(true); renderHeader();
  }, 550 + Math.random() * 650);
}
function answer(text, learned) {
  const p = P(), c = aiCtx(), all = aiIntents();
  const sources = [{ synonyms: p.ai.syn, weight: 1 }, { synonyms: S.brain.synonyms || {}, votes: S.brain.votes || {}, weight: 0.6 }];
  sources.reverse(); // votes da fonte global primeiro
  const r = GuaiBrain.rank(text, all, sources);
  const top = r[0];
  if (top && top.it.escal && top.s >= 2) {
    const last = all.find((i) => i.id === p.ai.last);
    if (last && last.deep) return { role: "assistant", content: last.deep(c), intent: last.id };
    return { role: "assistant", content: `Bora resolver! Me conta: **qual comportamento** não melhorou e **o que exatamente acontece** quando tu tenta (onde, quando, o que ele faz). Com isso eu monto o plano avançado.` };
  }
  if (learned.length && (!top || top.s < 2)) return { role: "assistant", content: `Anotado! 📝 Vou lembrar que ele ${learned.join(" e ")} nas próximas respostas. Quer me perguntar algo sobre isso?` };
  if (top && top.s >= 2) {
    p.ai.last = top.it.id;
    const second = r.find((x) => x.it.id !== top.it.id && !x.it.small && x.s >= Math.max(2, top.s * 0.75));
    let content = top.it.a(c);
    if (second) content += `\n\n*Também posso te ajudar com: **${second.it.t}** — é só perguntar.*`;
    return { role: "assistant", content, intent: top.it.id, deep: !!top.it.deep };
  }
  const opts = r.filter((x) => !x.it.small && !x.it.escal).slice(0, 4).map((x) => ({ id: x.it.id, t: x.it.t }));
  const fill = ["l_mordida", "destroi", "latido", "l_junto", "medo", "l_sozinho", "teimoso"].map((id) => all.find((i) => i.id === id)).filter(Boolean);
  for (const f of fill) { if (opts.length >= 4) break; if (!opts.some((o) => o.id === f.id)) opts.push({ id: f.id, t: f.t }); }
  opts.push({ id: "_none", t: "Nenhum desses" });
  return { role: "assistant", content: `Hmm, não peguei 100% ainda 🤔 É sobre algum desses? Se tu escolher, **eu aprendo** e da próxima já entendo direto.`, opts, q: text };
}
function scrollChat(smooth) { requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: smooth ? "smooth" : "auto" })); }
document.addEventListener("click", (e) => {
  const q = e.target.closest("[data-q]"); if (q) return sendChat(q.dataset.q);
  const pk = e.target.closest("[data-pick]");
  if (pk) {
    const d = dog(), p = P(), m = d.chat[+pk.dataset.mi]; if (!m || !m.opts) return;
    const id = pk.dataset.pick, phrase = m.q || ""; delete m.opts;
    if (id === "_none") {
      pushMsg({ role: "user", content: "Nenhum desses" });
      pushMsg({ role: "assistant", content: `Beleza! Mandei tua pergunta pro adestrador da **Guaipecas** me ensinar 🧑‍🏫 — logo eu vou saber responder.\n\nEnquanto isso, tenta me contar de outro jeito: **o que ele faz**, **quando** e **onde**. Ex: *"ele late pra visita quando a campainha toca"*.` });
      api("brain", { body: { action: "miss", phrase, breed: d.breed } }).catch(() => {});
    } else {
      const it = aiIntents().find((x) => x.id === id); if (!it) return;
      const syn = (p.ai.syn[id] ||= {});
      for (const t of GuaiBrain.toks(phrase)) syn[t.slice(0, 7)] = Math.min(20, (syn[t.slice(0, 7)] || 0) + 2);
      api("brain", { body: { action: "learn", phrase, intent: id } }).catch(() => {});
      pushMsg({ role: "user", content: it.t });
      pushMsg({ role: "note", content: "🧠 Aprendi: quando falarem assim, é sobre " + it.t });
      p.ai.last = id;
      pushMsg({ role: "assistant", content: it.a(aiCtx()), intent: id, deep: !!it.deep });
    }
    save(); renderChat(); scrollChat(true); return;
  }
  const fb = e.target.closest("[data-fb]");
  if (fb) {
    const d = dog(), m = d.chat[+fb.dataset.mi]; if (!m) return;
    const it = aiIntents().find((x) => x.id === m.intent);
    if (fb.dataset.fb === "deep") { if (it && it.deep) { pushMsg({ role: "user", content: "Mais detalhes" }); pushMsg({ role: "assistant", content: it.deep(aiCtx()), intent: it.id }); } }
    else {
      if (m.fb) return toast("Já recebi teu feedback 💚");
      m.fb = fb.dataset.fb; api("brain", { body: { action: "vote", intent: m.intent, up: m.fb === "up" } }).catch(() => {});
      if (m.fb === "up") { toast("Valeu! Isso me ajuda a aprender 💚"); }
      else if (it && it.deep) { pushMsg({ role: "assistant", content: "Poxa, vamos mais fundo então 👇\n\n" + it.deep(aiCtx()), intent: it.id }); }
      else pushMsg({ role: "assistant", content: "Poxa! Me conta com mais detalhe o que tá acontecendo (o que ele faz, quando e onde) que eu tento de outro jeito." });
    }
    save(); renderChat(); if (fb.dataset.fb !== "up") scrollChat(true);
  }
});
$("#chatSend").onclick = () => { const t = $("#chatIn"); sendChat(t.value); t.value = ""; t.style.height = ""; };
$("#chatIn").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#chatSend").click(); } });
$("#chatIn").addEventListener("input", (e) => { e.target.style.height = ""; e.target.style.height = Math.min(130, e.target.scrollHeight) + "px"; });
$("#chatClear").onclick = () => { if (!confirm("Limpar a conversa? (O que a IA aprendeu sobre ele continua guardado.)")) return; dog().chat = []; save(); renderChat(); };

/* ---------------- perfil do cão ---------------- */
function renderCao() {
  const d = dog(), p = P(), B = BREEDS[d.breed];
  const m = ageMonths(d), age = m < 3.7 ? Math.floor(m * 4.35) + " semanas" : m < 24 ? Math.floor(m) + " meses" : Math.floor(m / 12) + " anos";
  const lessonsDone = Object.values(p.lessons).filter((l) => l.done).length;
  const vax = (d.vaccines || []).slice().sort((a, b) => (a.next || "9").localeCompare(b.next || "9"));
  const { r } = rankOf(p.xp);
  let h = `<div class="panel" style="margin-top:6px"><div class="dogcard"><div class="dogphoto" style="${d.photo ? `background-image:url(${d.photo})` : ""}">${d.photo ? "" : "🐶"}</div><div class="grow">
      <h2>${esc(d.name)}</h2><div class="tags"><span class="tag br" style="background:${B.color}">${esc(B.name)}</span><span class="tag">${d.sex === "f" ? "♀ Fêmea" : "♂ Macho"}</span><span class="tag">${age}</span>${d.weight ? `<span class="tag">${d.weight} kg</span>` : ""}${d.neutered ? `<span class="tag">Castrado</span>` : ""}</div>
      <p class="muted small" style="margin:6px 0 0">Nasceu em ${fmtDate(d.birth)} · ⭐ ${esc(r.t)}</p></div></div>
      ${d.notes ? `<p class="small" style="margin:12px 0 0;background:var(--bg);padding:10px 12px;border-radius:12px">${esc(d.notes)}</p>` : ""}
      <button class="btn ghost block sm" id="editDog" style="margin-top:12px">✏️ Editar perfil</button></div>
    <div class="panel"><div class="kstats"><div><b>${lessonsDone}</b><span>lições</span></div><div><b>${totalSessions()}</b><span>sessões</span></div><div><b>${p.clicks.total}</b><span>cliques</span></div><div><b>${p.days.length}</b><span>dias</span></div></div></div>
    <div class="panel"><div class="panel-head"><h3>💉 Vacinas</h3><button class="btn soft sm" id="addVax">+ Adicionar</button></div>
      ${vax.length ? vax.map((v) => { const st = vaxState(v); const dd = v.next ? Math.round((new Date(v.next + "T12:00:00") - Date.now()) / 864e5) : null; return `<div class="vax ${st}" data-vax="${esc(v.id)}"><div class="vi">💉</div><div class="grow"><b>${esc(v.name)}</b><div class="small muted">Aplicada ${fmtDate(v.date)}${v.vet ? " · " + esc(v.vet) : ""}</div><div class="vs">${!v.next ? "Sem reforço marcado" : st === "late" ? `Atrasada há ${-dd} dia(s)!` : st === "soon" ? `Reforço em ${dd} dia(s) · ${fmtDate(v.next)}` : `Próxima: ${fmtDate(v.next)}`}</div></div></div>`; }).join("") : `<p class="muted small" style="margin:0">Nenhuma vacina cadastrada. Adiciona pra receber o lembrete de reforço.</p>`}
      <div style="margin-top:12px"><label class="btn ghost sm" for="cardIn">📄 ${d.vaccineCard ? "Trocar" : "Anexar"} foto da carteirinha</label><input type="file" id="cardIn" accept="image/*" class="hidden"></div>
      ${d.vaccineCard ? `<img class="cardimg" src="${d.vaccineCard}" alt="Carteirinha de vacinação">` : ""}</div>
    <div class="panel"><h3>🏅 Medalhas</h3><div class="badges">${BADGES.map((b) => `<div class="badge ${p.badges.includes(b.id) ? "" : "off"}" title="${esc(b.d)}"><span class="e">${b.ic}</span>${esc(b.t)}</div>`).join("")}</div></div>
    <div class="panel"><h3>🐕 Sobre a raça</h3><p class="small">${esc(B.about)}</p><p class="small" style="margin:0"><b>Exercício:</b> ${esc(B.exercise)}</p></div>
    <div class="panel doglist"><div class="panel-head"><h3>Meus cães</h3><button class="btn soft sm" id="addDog">+ Novo cão</button></div>
      ${S.dogs.map((x) => `<div class="d"><div class="avatar" style="${x.photo ? `background-image:url(${x.photo})` : ""}">${x.photo ? "" : "🐶"}</div><div class="grow"><b>${esc(x.name)}</b><div class="small muted">${esc(BREEDS[x.breed]?.name || "")}</div></div>${x.id === d.id ? `<span class="chip">Ativo</span>` : `<button class="btn ghost sm" data-switch="${x.id}">Treinar</button>`}</div>`).join("")}</div>
    <div class="panel"><h3>⚙️ Ajustes</h3>
      <label class="switch">Som do clicker<input type="checkbox" id="optSound" ${S.sound ? "checked" : ""}></label>
      <label class="switch">Vibração<input type="checkbox" id="optVibe" ${S.vibe ? "checked" : ""}></label>
      <div class="field" style="margin-top:12px"><span>Tema</span><div class="seg" id="themeSeg">${["auto", "light", "dark"].map((t) => `<button data-theme="${t}" class="${(LS.get("theme", "auto")) === t ? "on" : ""}">${{ auto: "Automático", light: "Claro", dark: "Escuro" }[t]}</button>`).join("")}</div></div>
      <p class="muted small">Conta: <b>${esc(S.user?.name || "")}</b> · ${esc(S.user?.email || "")}</p>
      <p class="muted tiny">Pra usar como app: no iPhone, Compartilhar → "Adicionar à Tela de Início". No Android, menu ⋮ → "Instalar app".</p>
      <button class="btn ghost block" data-logout2 style="color:var(--red)">Sair da conta</button></div>`;
  $("#caoBody").innerHTML = h;
  $("#editDog").onclick = () => openDogForm(d);
  $("#addDog").onclick = () => S.dogs.length >= 6 ? toast("Máximo de 6 cães") : openDogForm(null);
  $("#addVax").onclick = () => openVax(null);
  $$("[data-vax]").forEach((el) => el.onclick = () => openVax(el.dataset.vax));
  $$("[data-switch]").forEach((b) => b.onclick = async () => { await flush(); S.activeDogId = b.dataset.switch; api("me", { body: { action: "setActive", id: S.activeDogId } }).catch(() => {}); cacheMe(); toast("Treinando: " + dog().name); enterApp("trilha"); });
  $("#cardIn").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const img = await compressImage(f, 1100, 480_000); const r = await api("me", { body: { action: "saveDog", dog: { ...d, vaccineCard: img } } }); Object.assign(d, r.dog); cacheMe(); toast("Carteirinha salva ✓"); renderCao(); } catch (err) { toast(err.message); } };
  $("#optSound").onchange = (e) => { S.sound = e.target.checked; LS.set("sound", S.sound); };
  $("#optVibe").onchange = (e) => { S.vibe = e.target.checked; LS.set("vibe", S.vibe); };
  $$("#themeSeg button").forEach((b) => b.onclick = () => { LS.set("theme", b.dataset.theme); applyTheme(); renderCao(); });
  $("[data-logout2]").onclick = async () => { await flush(); logout(); };
}
function applyTheme() { const t = LS.get("theme", "auto"); if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t); }
function openVax(id) {
  const d = dog(), v = id ? (d.vaccines || []).find((x) => x.id === id) : null;
  openSheet(`<h2 style="font-size:1.5rem;margin:4px 0 16px">${v ? "Editar vacina" : "Nova vacina"}</h2>
    <form id="f-vax"><div class="err hidden" data-err></div>
    <label class="field"><span>Vacina</span><input name="name" list="vaxList" required maxlength="60" value="${esc(v?.name || "")}" placeholder="Ex: V10 – 2ª dose"><datalist id="vaxList">${VACCINES.map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label>
    <div class="grid2"><label class="field"><span>Aplicada em</span><input name="date" type="date" required value="${esc(v?.date || dayKey())}"></label>
    <label class="field"><span>Próxima dose</span><input name="next" type="date" value="${esc(v?.next || "")}"></label></div>
    <div class="row wrapr" style="margin:-4px 0 14px"><span class="small muted">Atalho:</span><button type="button" class="btn ghost sm" data-plus="21">+21 dias</button><button type="button" class="btn ghost sm" data-plus="30">+30 dias</button><button type="button" class="btn ghost sm" data-plus="365">+1 ano</button></div>
    <label class="field"><span>Veterinário/clínica</span><input name="vet" maxlength="60" value="${esc(v?.vet || "")}"></label>
    <button class="btn main block" type="submit">Salvar</button>
    ${v ? `<button class="btn ghost block" type="button" id="delVax" style="margin-top:10px;color:var(--red)">Excluir</button>` : ""}</form>`, () => {
    const f = $("#f-vax");
    $$("[data-plus]").forEach((b) => b.onclick = () => { const base = new Date((f.date.value || dayKey()) + "T12:00:00"); base.setDate(base.getDate() + +b.dataset.plus); f.next.value = dayKey(base); });
    f.onsubmit = (e) => {
      e.preventDefault(); d.vaccines ||= [];
      const nv = { id: v?.id || "v" + Date.now().toString(36), name: f.name.value.trim(), date: f.date.value, next: f.next.value, vet: f.vet.value.trim() };
      if (v) Object.assign(v, nv); else d.vaccines.push(nv);
      checkBadges(); save(true); closeSheet(); renderCao(); renderHeader(); toast("Vacina salva 💉");
    };
    const del = $("#delVax"); if (del) del.onclick = () => { d.vaccines = d.vaccines.filter((x) => x.id !== v.id); save(true); closeSheet(); renderCao(); renderHeader(); };
  });
}

/* ---------------- navegação ---------------- */
function goTab(t) {
  S.tab = t;
  $$(".tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  $$(".view").forEach((v) => v.classList.toggle("on", v.id === "v-" + t));
  $("#composer").classList.toggle("hidden", t !== "ia");
  if (t === "rotina") renderRotina();
  if (t === "cao") renderCao();
  if (t === "ia") { renderChat(); scrollChat(); } else window.scrollTo(0, 0);
  if (t === "clicker") $("#clickTotal").textContent = P().clicks.total;
}
document.addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t && $("#s-app").classList.contains("on")) goTab(t.dataset.tab); });
function renderAll() { renderHeader(); renderTrilha(); if (S.tab === "rotina") renderRotina(); if (S.tab === "cao") renderCao(); }
function enterApp(tab = S.tab || "trilha") {
  show("s-app"); P(); checkMissions(true); renderAll(); goTab(tab);
  if (tab === "trilha") { const cur = currentNode(); if (cur) setTimeout(() => { const el = $(`.dot[data-open="${cur.id}"]`); if (el && el.getBoundingClientRect().top > innerHeight) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 400); }
}

/* ---------------- ADMIN ---------------- */
let ADM = { users: [], filter: "pending", q: "", brain: null };
async function openAdmin() {
  show("s-admin");
  try {
    const r = await api("admin"); ADM.users = r.users;
    $("#admStorage").textContent = "💾 " + r.storage.label;
    $("#admWarn").innerHTML = r.warnings.map((w) => `<div class="warn">⚠️ ${esc(w)}</div>`).join("");
    renderAdmin();
  } catch (e) { if (e.status === 401) return logout(); toast(e.message); }
}
function renderAdmin() {
  const U = ADM.users, cnt = (s) => U.filter((u) => u.status === s).length;
  $("#admCounts").innerHTML = `<div><b style="color:#B27320">${cnt("pending")}</b><span>pendentes</span></div><div><b style="color:var(--teal)">${cnt("approved")}</b><span>aprovados</span></div><div><b>${U.length}</b><span>total</span></div>`;
  const q = ADM.q.toLowerCase().replace(/\D/g, "") || null, qt = ADM.q.toLowerCase().trim();
  let list = U.filter((u) => ADM.filter === "pending" ? u.status === "pending" : ADM.filter === "approved" ? u.status === "approved" : ["rejected", "blocked"].includes(u.status));
  if (qt) list = U.filter((u) => u.name.toLowerCase().includes(qt) || u.email.includes(qt) || (q && u.phone.includes(q)));
  const lbl = { pending: "Pendente", approved: "Aprovado", rejected: "Recusado", blocked: "Bloqueado" };
  const when = (t) => t ? new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
  const ph = (p) => p.length === 11 ? `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}` : p.length === 10 ? `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}` : p;
  $("#admList").innerHTML = list.length ? list.map((u) => `<div class="ucard"><div class="row"><h4 class="grow">${esc(u.name)}</h4><span class="st ${u.status}">${lbl[u.status]}</span></div>
    <div class="meta">✉️ ${esc(u.email)}<br>📱 <a href="https://wa.me/55${esc(u.phone)}" target="_blank" rel="noopener">${esc(ph(u.phone))}</a><br>🗓️ Cadastro: ${when(u.createdAt)}${u.lastLogin ? ` · Último acesso: ${when(u.lastLogin)}` : ""}</div>
    ${u.dogs && u.dogs.length ? `<div class="minidogs">${u.dogs.map((d) => `<span><i style="${d.photo ? `background-image:url(${d.photo})` : ""}"></i>${esc(d.name)} · ${esc(BREEDS[d.breed]?.short || "")} · ${d.done} lições · ⭐${d.xp}</span>`).join("")}</div>` : ""}
    <div class="acts">${u.status !== "approved" ? `<button class="btn main sm" data-ua="approve" data-id="${u.id}">✓ Aprovar</button>` : ""}${u.status === "pending" ? `<button class="btn ghost sm" data-ua="reject" data-id="${u.id}">Recusar</button>` : ""}${u.status === "approved" ? `<button class="btn ghost sm" data-ua="block" data-id="${u.id}">🔒 Bloquear</button>` : ""}<button class="btn ghost sm" data-ua="password" data-id="${u.id}">🔑 Senha</button><button class="btn ghost sm" data-ua="delete" data-id="${u.id}" style="color:var(--red)">Excluir</button></div></div>`).join("")
    : `<div class="empty"><span class="e">${ADM.filter === "pending" ? "🎉" : "🐾"}</span>${ADM.filter === "pending" && !qt ? "Nenhum cadastro esperando aprovação." : "Ninguém aqui."}</div>`;
}
$$("#admFilter button").forEach((b) => b.onclick = () => { ADM.filter = b.dataset.f; $$("#admFilter button").forEach((x) => x.classList.toggle("on", x === b)); renderAdmin(); });
$("#admSearch").oninput = (e) => { ADM.q = e.target.value; renderAdmin(); };
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-ua]"); if (!b) return;
  const u = ADM.users.find((x) => x.id === b.dataset.id), a = b.dataset.ua, body = { action: a, id: u.id };
  if (a === "delete" && !confirm(`Excluir ${u.name} e todos os dados? Não dá pra desfazer.`)) return;
  if (a === "block" && !confirm(`Bloquear ${u.name}?`)) return;
  if (a === "password") { const pw = prompt(`Nova senha pra ${u.name} (6+ caracteres):`); if (!pw) return; body.password = pw; }
  b.disabled = true;
  try {
    await api("admin", { body });
    toast({ approve: "Aprovado ✓", reject: "Recusado", block: "Bloqueado", delete: "Excluído", password: "Senha trocada ✓" }[a]);
    await openAdmin();
  } catch (err) { toast(err.message); b.disabled = false; }
});
$$("#admSeg button").forEach((b) => b.onclick = () => {
  $$("#admSeg button").forEach((x) => x.classList.toggle("on", x === b));
  $("#admUsers").classList.toggle("hidden", b.dataset.adm !== "users"); $("#admIa").classList.toggle("hidden", b.dataset.adm !== "ia");
  if (b.dataset.adm === "ia") loadAdmIa();
});
async function loadAdmIa() {
  try { ADM.brain = await api("brain"); renderAdmIa(); } catch (e) { toast(e.message); }
}
function renderAdmIa() {
  const B = ADM.brain, synN = Object.values(B.synonyms || {}).reduce((a, o) => a + Object.keys(o).length, 0);
  const votes = Object.values(B.votes || {}).reduce((a, v) => a + v.up + v.down, 0);
  $("#admIa").innerHTML = `<div class="counts"><div><b>${(B.misses || []).length}</b><span>sem resposta</span></div><div><b>${synN}</b><span>palavras aprendidas</span></div><div><b>${votes}</b><span>avaliações</span></div></div>
    <div class="panel"><h3>✍️ Ensinar resposta nova</h3><p class="muted small">A IA usa as palavras da pergunta + palavras-chave pra reconhecer o tema. Pode usar **negrito**, listas com "1." e "- ".</p>
      <form id="f-teach"><input type="hidden" name="missId"><label class="field"><span>Pergunta / tema</span><input name="q" required maxlength="200" placeholder="Ex: Meu cão sobe na mesa"></label>
      <label class="field"><span>Palavras-chave extras (opcional)</span><input name="keywords" maxlength="200" placeholder="mesa, subir, cozinha"></label>
      <label class="field"><span>Só pra raça</span><select name="breed"><option value="">Todas as raças</option>${Object.entries(BREEDS).map(([k, b]) => `<option value="${k}">${esc(b.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Resposta</span><textarea name="a" required maxlength="4000" style="min-height:160px" placeholder="1. Primeiro passo...\n2. ..."></textarea></label>
      <button class="btn main block" type="submit">Ensinar a IA</button></form></div>
    <div class="panel"><h3>❓ Perguntas que ela não soube</h3>${(B.misses || []).length ? B.misses.map((m) => `<div class="vax"><div class="grow"><b>${esc(m.q)}</b><div class="small muted">${m.breed ? esc(BREEDS[m.breed]?.short || m.breed) + " · " : ""}${new Date(m.t).toLocaleDateString("pt-BR")}</div></div><button class="btn soft sm" data-answer="${m.id}">Responder</button><button class="btn ghost sm" data-dismiss="${m.id}" aria-label="Descartar">×</button></div>`).join("") : `<p class="muted small" style="margin:0">Nada pendente. A IA tá craque! 🎉</p>`}</div>
    <div class="panel"><h3>📚 Respostas ensinadas</h3>${(B.custom || []).length ? B.custom.map((c) => `<details class="prob"><summary>${esc(c.q)}${c.breed ? ` · ${esc(BREEDS[c.breed]?.short)}` : ""}</summary><p style="white-space:pre-wrap">${esc(c.a)}</p><p><button class="btn ghost sm" data-delcustom="${c.id}" style="color:var(--red)">Apagar</button></p></details>`).join("") : `<p class="muted small" style="margin:0">Nenhuma ainda.</p>`}</div>
    <button class="btn ghost block" id="resetLearn" style="color:var(--red)">Zerar aprendizado automático</button>`;
  $("#f-teach").onsubmit = async (e) => {
    e.preventDefault(); const f = e.target;
    try { await api("brain", { body: { action: "addCustom", q: f.q.value, a: f.a.value, keywords: f.keywords.value, breed: f.breed.value, missId: f.missId.value } }); toast("A IA aprendeu! 🧠"); loadAdmIa(); } catch (err) { toast(err.message); }
  };
  $$("[data-answer]").forEach((b) => b.onclick = () => { const m = B.misses.find((x) => x.id === b.dataset.answer), f = $("#f-teach"); f.q.value = m.q; f.missId.value = m.id; if (m.breed) f.breed.value = m.breed; f.a.focus(); f.scrollIntoView({ behavior: "smooth" }); });
  $$("[data-dismiss]").forEach((b) => b.onclick = async () => { await api("brain", { body: { action: "dismissMiss", id: b.dataset.dismiss } }); loadAdmIa(); });
  $$("[data-delcustom]").forEach((b) => b.onclick = async () => { if (!confirm("Apagar essa resposta?")) return; await api("brain", { body: { action: "deleteCustom", id: b.dataset.delcustom } }); loadAdmIa(); });
  $("#resetLearn").onclick = async () => { if (!confirm("Zerar palavras aprendidas e avaliações? (Respostas ensinadas continuam.)")) return; await api("brain", { body: { action: "resetLearning" } }); loadAdmIa(); };
}

/* ---------------- PWA ---------------- */
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});

boot();
})();
