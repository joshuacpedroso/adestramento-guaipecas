# Adestramento Guaipecas 🐾

Guia de adestramento **completo e gamificado** por raça — Pastor Alemão, Vira-lata (SRD), Pastor Belga Malinois e Pitbull. Feito pra usar no celular (dá pra instalar como app).

## O que tem

- **Cadastro com aprovação**: o usuário se cadastra (nome, e-mail, telefone, senha) e só entra depois que o **admin aprova**.
- **Perfil do cão**: foto, raça, nascimento, sexo, peso, castração, observações, **vacinas** com lembrete de reforço e foto da carteirinha. Até 6 cães por conta.
- **Trilha estilo jogo**: 6 mundos (Primeiros passos → Boas maneiras → Autocontrole → Passeio → **Especial da raça** → Avançado). Cada mundo termina com uma **prova** que libera o próximo.
- **Lições completas**: porquê, passo a passo com etapas marcáveis, critério pra passar de fase, problemas comuns e dica específica da raça. Filhote x adulto muda o conteúdo.
- **Sessões de treino** com timer no tempo ideal da raça, clicker e contador de acertos/erros.
- **Missões do dia**, XP, níveis, sequência de dias 🔥 e medalhas.
- **Clicker** com som e **Rotina** (timer do xixi, registros, gráfico da semana).
- **IA Guaipecas** (própria, sem API paga): responde sob medida pra raça/idade, **lembra** fatos do cão, **aprende** com os temas que o tutor escolhe e com 👍/👎. O que ela não souber vai pro painel do admin, que ensina respostas novas.
- **Painel admin**: aprovar/recusar/bloquear/excluir usuários, trocar senha, ver os cães e o progresso, ensinar a IA.

## Rodar local

```bash
npm install
npm run dev   # http://localhost:3000
```

Admin padrão: **admin / guaipecas2026** (troca com `ADMIN_PASSWORD`). Local, os dados ficam em `./data/*.json`.

## Subir na Vercel

1. Importa este repositório na Vercel (Framework: **Other**, sem build).
2. Em **Storage**, cria um **Blob** e conecta no projeto (cria a `BLOB_READ_WRITE_TOKEN` sozinho). É ali que os usuários ficam salvos em **JSON** — sem ele os dados somem a cada deploy.
3. Em **Settings → Environment Variables**: `ADMIN_USER`, `ADMIN_PASSWORD` (senha forte) e `SESSION_SECRET` (texto grande aleatório).
4. Redeploy. Pronto!

## Estrutura

```
public/              front-end (HTML/CSS/JS puro)
  assets/content.js  raças, mundos, lições, missões, medalhas
  assets/brain.js    IA Guaipecas (intenções + memória + aprendizado)
  assets/app.js      app
api/                 funções serverless (auth, me, admin, brain)
lib/                 armazenamento JSON (Vercel Blob ou arquivo) e autenticação
```
