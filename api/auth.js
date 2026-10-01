import crypto from "node:crypto";
import { send, body, wrap, normEmail, normPhone } from "../lib/http.js";
import { getUsers, saveUsers } from "../lib/store.js";
import { hashPassword, checkPassword, checkAdmin, signToken, publicUser, readToken, ADMIN_USER } from "../lib/auth.js";

const STATUS_MSG = {
  pending: "Teu cadastro tá em análise. Assim que o admin aprovar, tu entra. 🐾",
  rejected: "Teu cadastro não foi aprovado. Fala com a Adestramento Guaipecas.",
  blocked: "Teu acesso tá bloqueado. Fala com a Adestramento Guaipecas.",
};

export default wrap(async (req, res) => {
  if (req.method === "GET") {
    // checa status do token atual (usado pela tela "aguardando aprovação")
    const t = readToken(req);
    if (!t) return send(res, 401, { error: "Sessão expirada" });
    if (t.role === "admin") return send(res, 200, { role: "admin" });
    const u = (await getUsers()).find((x) => x.id === t.uid);
    if (!u) return send(res, 401, { error: "Conta não encontrada" });
    return send(res, 200, { role: "user", status: u.status, user: publicUser(u) });
  }
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido" });
  const b = await body(req);

  if (b.action === "register") {
    const name = String(b.name || "").trim().slice(0, 60);
    const email = normEmail(b.email);
    const phone = normPhone(b.phone);
    const password = String(b.password || "");
    if (name.length < 2) return send(res, 400, { error: "Coloca teu nome completo." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: "E-mail inválido." });
    if (phone.length < 10 || phone.length > 13) return send(res, 400, { error: "Telefone inválido. Usa DDD + número." });
    if (password.length < 6) return send(res, 400, { error: "A senha precisa de pelo menos 6 caracteres." });
    if (email === ADMIN_USER.toLowerCase()) return send(res, 400, { error: "E-mail não permitido." });

    const users = await getUsers();
    if (users.some((u) => u.email === email)) return send(res, 409, { error: "Esse e-mail já tem cadastro. Faz login." });
    if (users.some((u) => u.phone === phone)) return send(res, 409, { error: "Esse telefone já tem cadastro. Faz login." });

    const { salt, hash } = hashPassword(password);
    const u = { id: crypto.randomUUID(), name, email, phone, salt, hash, status: "pending", createdAt: Date.now() };
    users.push(u);
    await saveUsers(users);
    return send(res, 201, { ok: true, status: "pending", token: signToken({ uid: u.id, role: "user" }), user: publicUser(u), message: STATUS_MSG.pending });
  }

  if (b.action === "login") {
    const login = String(b.login || "").trim();
    const password = String(b.password || "");
    if (!login || !password) return send(res, 400, { error: "Preenche login e senha." });

    if (checkAdmin(login, password)) {
      return send(res, 200, { role: "admin", token: signToken({ role: "admin" }, 7) });
    }
    const users = await getUsers();
    const email = normEmail(login);
    const phone = normPhone(login);
    const u = users.find((x) => x.email === email || (phone.length >= 10 && x.phone === phone));
    if (!u || !checkPassword(password, u.salt, u.hash)) {
      await new Promise((r) => setTimeout(r, 400));
      return send(res, 401, { error: "Login ou senha errados." });
    }
    const token = signToken({ uid: u.id, role: "user" });
    if (u.status !== "approved") {
      return send(res, 200, { role: "user", status: u.status, token, user: publicUser(u), message: STATUS_MSG[u.status] });
    }
    u.lastLogin = Date.now();
    await saveUsers(users);
    return send(res, 200, { role: "user", status: "approved", token, user: publicUser(u) });
  }

  return send(res, 400, { error: "Ação inválida" });
});
