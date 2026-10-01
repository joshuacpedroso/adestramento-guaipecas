import { send, body, wrap } from "../lib/http.js";
import { getUsers, saveUsers, getUserData, deleteUserData, storageMode } from "../lib/store.js";
import { requireAdmin, publicUser, hashPassword, usingDefaultAdmin, usingDefaultSecret } from "../lib/auth.js";

function dogSummary(d) {
  const p = d.progress || {};
  const lessons = p.lessons || {};
  return {
    id: d.id,
    name: d.name,
    breed: d.breed,
    birth: d.birth,
    photo: d.photo || null,
    done: Object.values(lessons).filter((l) => l && l.done).length,
    xp: p.xp || 0,
    lastActive: (p.days || []).slice(-1)[0] || null,
  };
}

export default wrap(async (req, res) => {
  if (!requireAdmin(req)) return send(res, 401, { error: "Só o admin pode acessar." });

  if (req.method === "GET") {
    const users = await getUsers();
    const withDogs = await Promise.all(
      users.map(async (u) => {
        let dogs = [];
        if (u.status === "approved") {
          try { dogs = ((await getUserData(u.id)).dogs || []).map(dogSummary); } catch { dogs = []; }
        }
        return { ...publicUser(u), approvedAt: u.approvedAt || null, lastLogin: u.lastLogin || null, dogs };
      })
    );
    withDogs.sort((a, b) => b.createdAt - a.createdAt);
    return send(res, 200, {
      users: withDogs,
      storage: storageMode(),
      warnings: [
        usingDefaultAdmin() && "Tu tá usando a senha de admin padrão. Configura ADMIN_PASSWORD na Vercel.",
        usingDefaultSecret() && "Configura SESSION_SECRET na Vercel pra deixar os logins mais seguros.",
        !storageMode().persistent && "Os dados estão num armazenamento temporário. Conecta o Vercel Blob no projeto.",
      ].filter(Boolean),
    });
  }

  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido" });
  const b = await body(req);
  const users = await getUsers();
  const i = users.findIndex((u) => u.id === b.id);
  if (i < 0) return send(res, 404, { error: "Usuário não encontrado" });
  const u = users[i];

  switch (b.action) {
    case "approve":
      u.status = "approved";
      u.approvedAt = Date.now();
      break;
    case "reject":
      u.status = "rejected";
      break;
    case "block":
      u.status = "blocked";
      break;
    case "pending":
      u.status = "pending";
      break;
    case "password": {
      const pw = String(b.password || "");
      if (pw.length < 6) return send(res, 400, { error: "Senha precisa de 6+ caracteres." });
      Object.assign(u, hashPassword(pw));
      break;
    }
    case "delete":
      users.splice(i, 1);
      await saveUsers(users);
      await deleteUserData(u.id);
      return send(res, 200, { ok: true });
    default:
      return send(res, 400, { error: "Ação inválida" });
  }
  await saveUsers(users);
  return send(res, 200, { ok: true, user: publicUser(u) });
});
