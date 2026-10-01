/* Guaipecas IA — adestrador virtual próprio, roda no aparelho.
   Como ela "pensa":
   1. Normaliza a frase e procura o tema (intenção) com mais pontos.
   2. Pontos vêm das palavras-chave + do que ela APRENDEU (sinônimos globais do servidor,
      sinônimos pessoais do tutor e votos 👍/👎).
   3. Responde sob medida pra raça, idade e o que ela LEMBRA do cão (memória).
   4. Não entendeu? Mostra os temas mais prováveis; o tema escolhido vira aprendizado.
   5. "Não funcionou" → ela aprofunda no último tema (plano avançado). */
(function () {
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const STOP = new Set("a o os as um uma uns umas de da do das dos dele dela em no na nos nas por pra pro para com sem que se ele ela eu tu voce vc meu minha seu sua e ou mas mais muito muita isso essa esse este esta como quando onde qual quais porque pq ta to ja nao sim tem ter fica faz fazer ser estar sobre ai la aqui oi entao tipo coisa cachorro cao dog cachorra cadela".split(" "));
  const toks = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const stem = (w) => (w.length >= 6 ? w.slice(0, w.length - 2) : w);

  function ctxFor(dog) {
    const B = BREEDS[dog.breed] || BREEDS.srd;
    const days = dog.birth ? Math.floor((Date.now() - new Date(dog.birth + "T12:00:00")) / 864e5) : NaN;
    const months = isNaN(days) ? null : days / 30.4;
    const mem = (dog.progress && dog.progress.ai && dog.progress.ai.mem) || {};
    const c = {
      dog, B, breed: dog.breed, name: dog.name || "teu cão", mem,
      months, puppy: months !== null && months < 6, young: months !== null && months < 12,
      age: isNaN(days) ? "idade não informada" : days < 112 ? `${Math.floor(days / 7)} semanas` : days < 730 ? `${Math.floor(months)} meses` : `${Math.floor(days / 365.25)} anos`,
      br(map) { return map[dog.breed] ? `\n\n🐕 **No caso do ${B.short}:** ${map[dog.breed]}` : ""; },
      ifPuppy(t, a = "") { return c.puppy ? t : a; },
    };
    return c;
  }

  /* ------------ memória: ela aprende fatos do cão na conversa ------------ */
  const MEM_RULES = [
    [/apartamento|\bape\b|\bap\b/, (m) => { m.home = "apartamento"; return "mora em apartamento"; }],
    [/casa com quintal|tem quintal|no quintal|quintal grande/, (m) => { m.home = "casa com quintal"; return "tem quintal"; }],
    [/crianca|criancas|meu filho|minha filha|bebe|neto/, (m) => { m.kids = true; return "convive com criança"; }],
    [/\bgato|\bgata\b|gatos/, (m) => { m.cat = true; return "convive com gato"; }],
    [/outro cachorro|outra cachorra|dois cachorros|outros caes|tenho mais um|outro cao/, (m) => { m.otherDog = true; return "tem outro cão em casa"; }],
    [/trabalho fora|fico fora|passo o dia fora|trabalho o dia|saio cedo|fica sozinho o dia/, (m) => { m.alone = true; return "fica sozinho boa parte do dia"; }],
    [/foi adotad|adotei|resgat|veio da rua|abrigo|ong/, (m) => { m.adopted = true; return "foi adotado/resgatado"; }],
  ];
  function learnFacts(text, mem) {
    const n = norm(text), learned = [];
    for (const [re, fn] of MEM_RULES) if (re.test(n)) { const before = JSON.stringify(mem); const f = fn(mem); if (JSON.stringify(mem) !== before) learned.push(f); }
    const fear = n.match(/medo d[eoa]s? ([a-z ]{3,30}?)(?:[.,!?]|$| e | quando| mas)/);
    if (fear) { mem.fears = mem.fears || []; const f = fear[1].trim(); if (!mem.fears.includes(f)) { mem.fears.push(f); mem.fears = mem.fears.slice(-6); learned.push("tem medo de " + f); } }
    const loves = n.match(/(?:ama|adora|louco por|doido por|gosta muito d[eoa]s?) ([a-z ]{3,25}?)(?:[.,!?]|$| e | mas)/);
    if (loves) { mem.loves = mem.loves || []; const f = loves[1].trim(); if (!mem.loves.includes(f)) { mem.loves.push(f); mem.loves = mem.loves.slice(-6); learned.push("ama " + f); } }
    return learned;
  }
  function memLines(c) {
    const m = c.mem, out = [];
    if (m.home) out.push(`mora em ${m.home}`);
    if (m.kids) out.push("convive com criança");
    if (m.cat) out.push("convive com gato");
    if (m.otherDog) out.push("tem outro cão em casa");
    if (m.alone) out.push("fica sozinho boa parte do dia");
    if (m.adopted) out.push("foi adotado/resgatado");
    if (m.fears && m.fears.length) out.push("tem medo de " + m.fears.join(", "));
    if (m.loves && m.loves.length) out.push("ama " + m.loves.join(", "));
    return out;
  }

  /* ------------------------------ intenções ------------------------------ */
  const I = [];
  const add = (o) => I.push(o);

  add({ id:"oi", t:"Oi", kw:["oi","ola","eai","bom dia","boa tarde","boa noite","salve","opa","fala"], small:true,
    a:(c)=>`Fala! 👋 Sou a **IA Guaipecas**, adestradora do ${c.name}. Me conta o que tá rolando: comportamento, comando que não sai, dúvida de rotina… Quanto mais detalhe tu der (onde, quando, o que acontece antes), melhor eu te ajudo.` });
  add({ id:"valeu", t:"Valeu", kw:["valeu","obrigado","obrigada","brigado","vlw","top","show","massa","perfeito","funcionou","deu certo"], small:true,
    a:(c)=>`Boa demais! 🙌 Fico feliz. Continua registrando as sessões na Trilha que o ${c.name} vai voando. Se travar em algo, volta aqui.` });
  add({ id:"quem", t:"Como tu funciona", kw:["quem e voce","quem voce","o que voce faz","como funciona","voce e uma ia","robo","ajuda","o que posso perguntar"], small:true,
    a:(c)=>`Sou a IA própria da **Adestramento Guaipecas** 🐾\n\n- Respondo na hora, até sem internet.\n- Ajusto tudo pra raça (**${c.B.name}**), idade (**${c.age}**) e o momento do ${c.name} na trilha.\n- **Aprendo com a conversa:** anoto fatos que tu conta (ex: "moramos em apartamento", "ele tem medo de moto") e uso nas próximas respostas.\n- Quando não entendo, te mostro temas parecidos. O que tu escolher eu aprendo pra próxima, pra todo mundo.\n- 👍/👎 nas respostas me ajudam a melhorar.\n- "Não funcionou" → eu aprofundo com um plano avançado.\n\nPergunta tipo: *"ele morde meu pé"*, *"puxa muito na guia"*, *"chora quando saio"*.` });
  add({ id:"memoria", t:"O que tu sabe dele", kw:["o que voce sabe","o que tu sabe","lembra","memoria","sabe sobre"], small:true,
    a:(c)=>{ const l = memLines(c); return `Isso aqui eu sei do ${c.name}:\n\n- ${c.B.name}, ${c.age}${c.dog.weight ? `, ${c.dog.weight} kg` : ""}\n${l.map(x=>"- "+x).join("\n")}${l.length ? "" : "\n\nAinda não aprendi nada da rotina dele. Me conta: onde ele mora, se fica sozinho, do que tem medo, o que ele ama…"}`; } });
  add({ id:"progresso", t:"Meu progresso", kw:["progresso","proxima licao","qual licao","o que treinar","por onde comeco","onde parei","o que fazer hoje","treinar hoje"], small:true,
    a:(c)=>{ const cur = c.current; return cur ? `Hoje o foco é **${cur.t}** (${cur.world}).\n\n${cur.why}\n\nAbre a Trilha e toca na lição pra ver o passo a passo. Faz sessões de ${c.B.session} min e para enquanto ele ainda tá animado.` : `O ${c.name} fechou a trilha toda! 🏆 Agora é manutenção: 5 min por dia revisando comandos em lugares diferentes.`; } });

  add({ id:"naofunciona", t:"Não funcionou", kw:["nao funciona","nao funcionou","nao deu certo","continua","ja tentei","mesmo assim","piorou","nada funciona","ainda","nao adianta","de novo"], escal:true, a:()=>"" });

  add({ id:"destroi", t:"Destrói coisas", kw:["destroi","destruindo","roi","roendo","rasga","rasgou","estraga","comeu o sofa","mastiga tudo","chinelo","moveis"],
    a:(c)=>`Destruição quase sempre é: **dente coçando** (filhote), **tédio** ou **ansiedade**. Plano completo:\n\n1. **Manejo já:** tudo que ele não pode roer fora do alcance. Quando tu não puder vigiar, ele fica no cercadinho/cômodo seguro.\n2. **Troca:** pegou algo proibido? Não corre atrás. Oferece um brinquedo/petisco, ele soltou → elogia e entrega o brinquedo certo.\n3. **Roer é necessidade:** deixa sempre 3 opções liberadas (borracha dura, corda, recheável). Rodízio diário pra não enjoar.\n4. **Cansa a cabeça:** 10 min de faro + 2 sessões de treino de 5 min por dia.\n5. **Ração no recheável** em vez do pote: ele trabalha 20 min pela comida.\n6. Se destrói **só quando tu sai**, porta, janela → pode ser ansiedade de separação (pergunta "chora quando saio").${c.ifPuppy("\n\n🦷 Ele tá na troca de dentes (4–7 meses): cenoura gelada ou pano molhado congelado aliviam a gengiva.")}${c.mem.alone ? "\n\n🧠 Tu me contou que ele fica muito sozinho: antes de sair, faz o faro + recheável congelado. Isso muda tudo." : ""}${c.br({ malinois:"Malinois destruindo = falta de trabalho. Ele precisa de 3 sessões mentais por dia, cabo de guerra com regras e momentos de calma treinados.", pastor:"Pastor entediado destrói. Faro e tarefas (buscar objeto, toca a mão) resolvem muito.", pitbull:"Mandíbula forte: só brinquedo de borracha maciça. Pelúcia vira lanche em 2 minutos.", srd:"Observa quando acontece: se é sempre no mesmo horário, ele tá te mostrando onde falta atividade." })}`,
    deep:(c)=>`Plano avançado pra destruição:\n\n1. **Diário de 3 dias:** anota hora, o que destruiu, onde tu tava. Normalmente aparece um padrão (ex: sempre fim de tarde = energia acumulada).\n2. **Agenda de enriquecimento:** manhã faro, meio-dia recheável, tarde treino + passeio, noite mastigação calma.\n3. **Descanso forçado:** filhote/cão jovem precisa dormir 16–18h. Cão cansado demais fica pior, não melhor. Cercadinho com mordedor por 1–2h depois de atividade.\n4. **Grava quando sair:** se ele começa a destruir nos primeiros 15 min e fica ofegante/latindo, é ansiedade → vai pra lição "Ficar sozinho" bem devagar e conversa com veterinário comportamentalista.\n5. Spray amargo nos móveis ajuda como apoio, nunca como solução sozinha.` });

  add({ id:"latido", t:"Late demais", kw:["late","latindo","latido","latir","late muito","late pra","uiva","barulho","vizinho reclama"],
    a:(c)=>`Primeiro descobre **o tipo de latido**, porque cada um tem solução diferente:\n\n**1. Alerta** (campainha, gente passando): deixa 2–3 latidos, fala "obrigado" com calma, chama ele pra perto e premia o silêncio. Bloqueia a visão da janela/portão com película ou tapume.\n**2. Pedindo atenção** (late olhando pra ti): ignora 100% — nem "shhh". Silêncio de 3 segundos → clica e premia. Vai piorar antes de melhorar (é normal!).\n**3. Tédio** (late sozinho no quintal): mais faro, recheáveis e treino. Não é treino de silêncio, é falta de atividade.\n**4. Medo/reatividade** (pra cães, pessoas, motos): trabalha distância + petisco (pergunta "medo").\n**5. Ansiedade** (só quando tu sai): pergunta "chora quando saio".\n\nEnsinar o "quieto":\n1. Quando ele latir pra algo, coloca um petisco no nariz dele.\n2. Pra cheirar ele para de latir: conta 1 s, clica e dá.\n3. Repete e vai aumentando o silêncio: 2, 3, 5 s.\n4. Coloca a palavra "quieto" antes do petisco.${c.mem.home === "apartamento" ? "\n\n🧠 Como vocês moram em apartamento: ruído branco/rádio baixinho ajuda a abafar sons do corredor." : ""}${c.br({ pastor:"Pastor tem instinto de guarda: o objetivo é 'avisa e para', não 'nunca late'.", malinois:"Malinois late de frustração quando a energia sobra. Botão de desligar (Mundo 5) é a lição chave.", pitbull:"Pitbull late pouco, mas quando late pra cães, trabalha a lição Calma perto de outros cães.", srd:"Vira-lata de quintal costuma latir de tédio: traz ele mais pra dentro e dá trabalho de faro." })}`,
    deep:(c)=>`Plano avançado do latido:\n\n1. **Registra 2 dias:** hora + gatilho + quanto tempo latiu.\n2. **Gatilho previsível (campainha):** grava o som. Toca baixinho → petisco. Aumenta o volume em dias. Depois: campainha = vai pro lugar (lição "Vai pro lugar").\n3. **Janela:** película fosca na metade de baixo resolve 50% dos latidos de alerta.\n4. **Atenção:** se tu ceder 1 vez a cada 10, ele aprende a latir mais tempo. Consistência total da família.\n5. **Nunca** coleira anti-latido (choque/citronela): suprime o sintoma e aumenta medo/ansiedade.` });

  add({ id:"medo", t:"Medo (fogos, trovão…)", kw:["medo","fogos","foguete","rojao","trovao","chuva forte","tremendo","treme","assustado","se esconde","panico","virada","ano novo","jogo de futebol"],
    a:(c)=>`Medo não se resolve com bronca nem forçando — se resolve com **segurança + associação boa**.\n\n**Na hora do susto (fogos/trovão):**\n1. Fecha janelas e cortinas, liga TV/música alta pra abafar.\n2. Deixa ele se esconder onde quiser (debaixo da cama é ok!). Monta uma "toca" com cobertor por cima da caixa/caminha.\n3. **Pode consolar sim** — carinho calmo não reforça medo. Fica perto, voz tranquila.\n4. Oferece mastigação (recheável, osso): mastigar acalma.\n5. Coleira/guia em casa nos dias de fogos — cão em pânico foge e se perde.\n\n**Treino pra diminuir o medo (dias calmos):**\n1. Vídeo de fogos no YouTube, volume quase zero.\n2. Som toca → petisco top. Som para → petisco para.\n3. Sessões de 2–3 min. Aumenta o volume só quando ele nem ligar.\n4. Leva semanas — sem pressa.\n\n⚠️ Pânico forte (baba, tenta fugir, se machuca): conversa com o veterinário sobre medicação pra datas como Ano Novo.${c.mem.fears && c.mem.fears.length ? `\n\n🧠 Lembrei: ele tem medo de **${c.mem.fears.join(", ")}**. Aplica o mesmo princípio: distância onde ele ainda come + petisco sempre que a coisa aparece.` : ""}${c.br({ srd:"Vira-lata resgatado costuma ter mais medos. A lição Confiança e medos (Mundo 5) é feita pra isso.", pastor:"Pastor medroso pode virar defensivo. Socialização gentil é prioridade.", malinois:"Malinois sensível a sons: treina a dessensibilização bem devagar." })}`,
    deep:(c)=>`Plano avançado pro medo:\n\n1. **Escala do medo (0–5):** 0 relaxado, 2 orelhas pra trás/lambendo lábio, 4 tremendo, 5 pânico. Treino só acontece no nível 0–1.\n2. **Contracondicionamento:** a coisa assustadora PREVÊ petisco. Ordem é importante: primeiro o som/objeto, depois o petisco.\n3. **Escolha dele:** nunca puxa pra perto. Ele aproximou sozinho? Jackpot.\n4. **Rotina previsível** reduz a ansiedade geral.\n5. **Feromônio canino (difusor)** pode ajudar como apoio.\n6. Se o medo tá aumentando com o tempo ou ele já mordeu por medo: veterinário comportamentalista. Não é falha tua, é cuidado de saúde.` });

  add({ id:"agressivo", t:"Rosna / agressivo", kw:["rosna","rosnando","agressivo","agressiva","atacou","ataca","mordeu alguem","morde as pessoas","mostra os dentes","bravo","brabo","avanca"],
    a:(c)=>`Rosnar é **comunicação**, não desobediência: ele tá dizendo "tô desconfortável". Nunca castiga o rosnado — senão ele pula o aviso e morde direto.\n\n**Segurança primeiro (hoje):**\n1. Identifica o gatilho: comida/osso? Mexer nele? Visitas? Outros cães? Acordar ele?\n2. **Evita o gatilho** enquanto treina (manejo não é derrota, é estratégia).\n3. Crianças nunca sozinhas com ele.\n\n**Treino:**\n1. Descobre a distância em que ele vê o gatilho e continua tranquilo.\n2. Gatilho aparece → petisco. Some → para o petisco.\n3. Avança só quando ele estiver relaxado 3 sessões seguidas.\n4. Ensina focinheira de cesto com petisco (fica seguro pra treinar).\n\n⚠️ **Se já mordeu e machucou, ou se a agressividade apareceu do nada:** veterinário primeiro (dor causa agressividade!) e adestrador presencial. Isso não é pra resolver sozinho pelo app.${c.mem.kids ? "\n\n🧠 Como tem criança em casa: separação física (portãozinho) até a avaliação. Ensina a criança a não abraçar, não mexer na comida e deixar ele dormir em paz." : ""}${c.br({ pitbull:"Pitbull: o foco é prevenção e responsabilidade. Focinheira feliz (Mundo 5) + guia curta + profissional presencial se houver histórico.", pastor:"Pastor protetor pode rosnar pra visitas: ensina o 'vai pro lugar' quando alguém chega e premia calma.", malinois:"Malinois com mordida forte: precisa de profissional que entenda de cão de trabalho. Nada de 'treino de ataque' caseiro.", srd:"Cão resgatado pode ter histórico. Paciência e profissional se tiver mordida." })}`,
    deep:(c)=>`Plano avançado (com segurança):\n\n1. **Check-up veterinário:** dor de dente, ouvido, coluna ou tireoide mudam comportamento.\n2. **Diário de incidentes:** gatilho, distância, sinais antes (congelou, olhou de lado, lambeu lábio).\n3. **Aprende os sinais de aviso:** bocejo, lamber o focinho, olho de baleia (branco aparecendo), corpo duro. Ao ver isso, aumenta a distância.\n4. **Meia-volta de emergência:** "vamos!" + giro + petisco. Treina 50 vezes em casa.\n5. **Focinheira condicionada** em toda situação de risco.\n6. **Profissional presencial** (adestrador de reforço positivo ou vet comportamentalista).` });

  add({ id:"recurso", t:"Rosna na comida/osso", kw:["rosna na comida","rosna no pote","guarda comida","osso","rosna quando pego","nao deixa pegar","protege","pote de comida","rosna no brinquedo","ciume"],
    a:(c)=>`Isso é **guarda de recursos**: medo de perder algo valioso. Tirar à força PIORA. O segredo é ele aprender que tua mão chegando = ganha mais.\n\n1. **Para de tirar coisas dele** (exceto perigo real — aí troca por algo melhor).\n2. Come em lugar tranquilo, sem ninguém passando perto.\n3. **Jogo do pote que enche:** dá o pote com pouca comida. Passa a uns 3 m e joga um pedaço de frango perto do pote. Vai embora.\n4. Repete dias seguidos, chegando mais perto bem aos poucos.\n5. Quando ele levantar a cabeça feliz quando tu chega (abanando), avança: joga direto no pote.\n6. Troca de objetos: ele com um brinquedo meh → mostra petisco top → soltou → ganha o petisco **e o brinquedo de volta**.\n\n⚠️ Se rosna com criança perto: criança NUNCA perto dele comendo. Come em cômodo separado.${c.br({ srd:"Muito comum em cão que já passou fome. Com paciência melhora muito.", pitbull:"Leva a sério e vai devagar. Se chegar a morder, profissional presencial.", malinois:"Com brinquedo, usa o cabo de guerra com regras: o 'solta' bem treinado resolve muito." })}`,
    deep:()=>`Plano avançado:\n\n1. Lista os recursos que ele guarda (comida, osso, brinquedo, sofá, tu?).\n2. Faz o jogo de troca com cada um, do menos ao mais valioso.\n3. Ensina "solta" e "deixa" muito bem (Mundos 3 e 4).\n4. Ossos/mastigáveis de alto valor só no cercadinho, onde ninguém incomoda.\n5. Se piorar ou já houve mordida: profissional presencial.` });

  add({ id:"coco", t:"Come cocô", kw:["come coco","comendo coco","come fezes","coprofagia","come o proprio coco","come coco de gato"],
    a:(c)=>`Comer cocô (coprofagia) é nojento mas **comum**, principalmente em filhote. Plano:\n\n1. **Limpa na hora** — sem cocô disponível, sem hábito.\n2. Quando ele fizer: chama pra ti ("vem!") e dá um petisco top. Ele aprende: fez cocô → corre pro tutor.\n3. Treina "deixa" (Mundo 3) e usa no passeio.\n4. Não faz escândalo quando ele come: alguns cães comem pra "esconder" depois de levar bronca.\n5. Confere com o vet: vermes, ração pouco digestiva ou fome podem causar.\n6. Cocô de gato: caixa de areia em lugar alto ou com tampa.${c.ifPuppy("\n\nFilhote costuma largar essa fase sozinho até 1 ano, com manejo.")}` });

  add({ id:"naocome", t:"Não quer comer", kw:["nao come","nao quer comer","sem apetite","fresco","enjoado","rejeita racao","deixa racao"],
    a:(c)=>`Primeiro: **saúde**. Se além de não comer ele tá mole, vomitando, com diarreia ou parou de beber água → veterinário hoje.\n\nSe ele tá ativo e só "fresco":\n1. Horário fixo: coloca o pote por **15 minutos**. Não comeu? Recolhe. Próxima refeição normal.\n2. Sem petisco extra nem comida humana entre refeições.\n3. Usa parte da ração no treino: ele trabalha pela comida e come mais.\n4. Recheável com ração molhada deixa a refeição divertida.\n5. Não fica trocando de ração toda semana (isso cria cão seletivo).\n\nEm 2–3 dias a maioria volta a comer normal.${c.br({ malinois:"Malinois às vezes come pouco quando tá muito agitado. Refeição depois do momento de calma.", pastor:"Pastor filhote não pode ficar pulando refeições: se for mais de 1 dia, vet." })}` });

  add({ id:"sofa", t:"Sobe no sofá/cama", kw:["sofa","sobe na cama","sobe no sofa","subir","cama","nao sai do sofa"],
    a:(c)=>`Primeiro decide a regra da casa (pode ou não pode?) — e **todo mundo** segue igual.\n\nSe não pode:\n1. Dá uma alternativa MELHOR: caminha confortável do lado do sofá.\n2. Ensina "lugar" (Mundo 6): petisco na caminha, ele sobe, clica.\n3. Ele subiu no sofá? "Toca" a mão (ou joga petisco no chão), desceu → elogia e manda pro lugar.\n4. Quando ninguém puder vigiar: bloqueia o sofá (cadeiras em cima, porta fechada).\n\nSe pode, ensina "sobe" e "desce" com convite: só sobe quando convidado.${c.br({ pastor:"Pastor jovem: evitar pular do sofá alto protege as articulações.", pitbull:"Pitbull ama um sofá: o convite 'sobe' é uma ótima recompensa." })}` });

  add({ id:"cava", t:"Cava buracos", kw:["cava","cavando","buraco","buracos","jardim","terra","planta"],
    a:(c)=>`Cavar é natural (caça, calor, tédio). Em vez de proibir, **direciona**:\n\n1. Monta um "cantinho do cavar": caixa de areia ou um canto de terra fofa.\n2. Enterra brinquedos e petiscos lá com ele olhando. Cavou lá? Festa!\n3. Pegou cavando no lugar errado? "Ei" neutro e leva pro cantinho.\n4. Locais proibidos: cobre com tela, pedras ou vaso por cima.\n5. Calor? Ele cava pra achar terra fresca: sombra e água fresca resolvem.\n6. Mais faro e treino = menos tédio = menos buraco.` });

  add({ id:"persegue", t:"Persegue moto/carro/gato", kw:["persegue","corre atras","moto","motos","carro","bicicleta","bike","corre atras de gato","caca","passaro"],
    a:(c)=>`Perseguir é instinto de caça. O treino é **substituir** a perseguição:\n\n1. **Segurança:** guia sempre; nunca solto perto de rua.\n2. Descobre a distância em que ele vê a moto/bicicleta e ainda consegue comer.\n3. Jogo "olha aquilo": ele olhou pra moto → clica → petisco. Ele aprende: moto aparece = olha pro tutor.\n4. Ensina meia-volta ("vamos!") em casa, 50 vezes, antes de usar na rua.\n5. Aproxima bem devagar com o passar das semanas.\n6. Dá uma saída pro instinto: cabo de guerra com regras, flirt pole (vara com brinquedo) e faro.${c.mem.cat ? "\n\n🧠 Como tem gato em casa: o gato precisa de lugares altos e rota de fuga. Treina 'deixa' e 'olha' com o gato à distância." : ""}${c.br({ malinois:"Malinois tem drive de presa enorme: o flirt pole com regras (pega/solta) é obrigatório na rotina.", pastor:"Pastor tem instinto de pastoreio: perseguir carro/moto é comum. Treina cedo.", pitbull:"Pitbull com gatos: nunca deixa os dois sozinhos sem ter certeza absoluta.", srd:"Se ele foi de rua, pode ter o hábito antigo. Paciência e guia." })}` });

  add({ id:"energia", t:"Energia / exercício", kw:["energia","agitado","nao para","hiperativo","exercicio","cansar","quanto passear","quanto tempo de passeio","elétrico","eletrico","louco","ansioso"],
    a:(c)=>`Pro **${c.B.name}**: ${c.B.exercise}\n\n**Receita do cão equilibrado (todo dia):**\n1. 🧠 **Cabeça:** 2–3 sessões de treino de ${c.B.session} min.\n2. 👃 **Faro:** 10 min de procura de petiscos ou tapete de fuçar.\n3. 🦷 **Mastigação:** 15–30 min de mordedor/recheável (acalma de verdade).\n4. 🦮 **Passeio de cheirar:** passeio lento, deixando ele farejar, vale mais que corrida.\n5. 😴 **Descanso:** ${c.puppy ? "filhote dorme 18h por dia! Agitado demais muitas vezes = sono." : "adulto dorme 12–14h. Cão que não descansa fica mais ligado."}\n\n⚠️ Só correr e jogar bola sem fim cria um atleta que precisa de cada vez mais.${c.mem.home === "apartamento" ? "\n\n🧠 Em apartamento: faro, recheáveis e treino de truques são teus melhores amigos. Corredor do prédio vira pista de treino." : ""}${c.br({ malinois:"Malinois: a lição Botão de desligar é a mais importante da vida dele.", pastor:"Pastor jovem: sem corrida longa até o vet liberar as articulações.", pitbull:"Pitbull: cabo de guerra com regras gasta muita energia em pouco tempo.", srd:"Observa quanto ele aguenta e ajusta. Vira-lata varia muito." })}` });

  add({ id:"petisco", t:"Qual petisco usar", kw:["petisco","petiscos","recompensa","premio","o que dar","biscoito","frango","salsicha","comida de treino"],
    a:(c)=>`Petisco de treino bom é **pequeno** (tamanho de ervilha), **macio** (come rápido) e **cheiroso**.\n\n- 🥇 **Alto valor** (rua, coisas difíceis): frango cozido sem tempero, fígado cozido, queijo branco em cubinhos.\n- 🥈 **Médio:** petisco comprado macio, picado.\n- 🥉 **Baixo** (casa, comando fácil): a própria ração dele.\n\n**Dica:** separa a ração do dia num pote e usa parte no treino — sem engordar.\n\n🚫 **Proibido:** chocolate, uva/passa, cebola, alho, xilitol (adoçante), macadâmia, abacate, osso cozido.${c.mem.loves && c.mem.loves.length ? `\n\n🧠 Tu me disse que ele ama **${c.mem.loves.join(", ")}** — usa como prêmio de alto valor!` : ""}\n\n${c.B.rewards}` });

  add({ id:"tempo", t:"Quanto tempo treinar", kw:["quanto tempo","quantas vezes","por dia","sessao","sessoes","quanto treinar","frequencia"],
    a:(c)=>`Pro ${c.name}: **sessões de ${c.B.session} minutos, 2 a 4 vezes por dia**.\n\n- Para sempre enquanto ele ainda tá acertando e animado (termina no alto!).\n- Cada sessão: um comando principal + revisão rápida de outro.\n- 5 min por dia todos os dias rende mais que 1h no domingo.\n- Treino "invisível" conta muito: senta antes da comida, espera na porta, olha antes do passeio.\n- Ele errou 3 vezes seguidas? Facilita (volta uma etapa).${c.ifPuppy("\n\nFilhote: 2–3 min já é ótimo. A atenção dele é curtinha.")}` });

  add({ id:"idade", t:"Idade pra treinar", kw:["que idade","com quantos meses","quando comecar","velho demais","muito novo","idade","adulto aprende","cachorro velho","idoso"],
    a:(c)=>`**Dá pra treinar com qualquer idade!**\n\n- **8 semanas:** já aprende nome, clicker, senta, xixi no lugar e socialização.\n- **3–6 meses:** fase de ouro pra boas maneiras e chamada.\n- **6–18 meses:** "adolescência": pode parecer que esqueceu tudo. Normal! Paciência e consistência.\n- **Adulto e idoso:** aprendem sim, às vezes só precisam desaprender hábitos. Sessões curtas e muito prêmio.\n\nO ${c.name} tem **${c.age}**. ${c.puppy ? "Fase perfeita pra construir a base!" : c.young ? "Tá na adolescência: mantém o treino curto e diário." : "Bora com tudo, adulto aprende muito bem com reforço positivo."}` });

  add({ id:"vacina", t:"Vacinas / quando passear", kw:["vacina","vacinas","quando passear","pode sair","rua","v8","v10","antirrabica","raiva","vermifugo","calendario"],
    a:(c)=>`Calendário mais comum (confirma SEMPRE com o veterinário):\n\n1. **V8/V10:** 1ª dose com 6–8 semanas, depois mais 2 doses a cada 3–4 semanas.\n2. **Antirrábica:** a partir de 12–16 semanas.\n3. **Reforço anual** de V8/V10 e antirrábica.\n4. Opcionais conforme a região: gripe canina, giárdia, leishmaniose.\n5. Vermífugo e antipulgas regulares.\n\n**Pode ir pra rua quando?** Geralmente 7–15 dias após a última dose da V8/V10, liberado pelo vet. Antes disso: rua **no colo** pra socializar sem pisar no chão.\n\n💉 Cadastra as vacinas na aba **Cão** — o app avisa quando o reforço tá chegando.${(c.dog.vaccines || []).length ? `\n\n🧠 Já tem ${(c.dog.vaccines || []).length} registro(s) de vacina do ${c.name}.` : ""}` });

  add({ id:"castrar", t:"Castração", kw:["castrar","castracao","castrado","cio","marcar territorio","marca territorio","levanta a pata"],
    a:(c)=>`Castração é decisão pra conversar com o **veterinário** (idade ideal varia por porte e raça).\n\n**O que costuma ajudar:** menos fuga atrás de fêmea no cio, menos marcação de território, previne doenças (piometra, tumores de mama, próstata).\n**O que NÃO resolve sozinha:** falta de educação, medo, ansiedade. Treino continua sendo treino.\n\n**Marcação de território em casa:**\n1. Limpa com produto **enzimático** (amônia piora).\n2. Volta a supervisionar como filhote por uns dias.\n3. Pegou levantando a pata? "Ei" neutro e leva pro lugar certo.${c.br({ pastor:"Em raças grandes, muitos vets preferem esperar o crescimento completo. Pergunta pro teu.", malinois:"Mesmo castrado, o Malinois continua com a energia de trabalho.", pitbull:"Muitos municípios incentivam castração da raça. Conversa com o vet.", srd:"Castração é uma das melhores coisas pra vira-lata fujão." })}` });

  add({ id:"comida", t:"Alimentação", kw:["racao","quanto comer","quanto de racao","alimentacao","comida caseira","pode comer","alimento","natural","obeso","gordo","magro","peso"],
    a:(c)=>`- **Frequência:** ${c.puppy ? "filhote 3–4 refeições por dia" : "adulto 2 refeições por dia"}, horários fixos.\n- **Quantidade:** segue a tabela da embalagem pelo peso ${c.puppy ? "previsto de adulto" : "ideal"} e ajusta: tu deve **sentir as costelas** fácil, sem ver.\n- **Ração** de boa qualidade${c.breed === "pastor" ? " pra raça grande" : ""}. Comida natural só com receita de veterinário nutricionista.\n- Petiscos de treino entram na conta (tira da ração).\n\n🚫 **Nunca:** chocolate, uva/passa, cebola, alho, xilitol, osso cozido, macadâmia, álcool.\n\nDúvida de peso: pesa ele todo mês e anota no perfil.${c.dog.weight ? ` Hoje ele tá com **${c.dog.weight} kg**.` : ""}` });

  add({ id:"higiene", t:"Banho e escovação", kw:["banho","escovar","escovacao","pelo","solta pelo","cheiro","dente","escovar dente","tosa","limpar orelha"],
    a:(c)=>`- **Banho:** a cada 15–30 dias (em excesso resseca a pele). Shampoo próprio pra cão.\n- **Escovação:** ${c.breed === "pastor" ? "2–3x por semana (5x na troca de pelo!)" : "1–2x por semana"}.\n- **Dentes:** escova com pasta canina 3x por semana. Começa só passando o dedo com pasta, com petisco.\n- **Unhas:** quando escuta "tec tec" no chão, tá na hora.\n- **Orelhas:** limpa só a parte visível com algodão e limpador próprio.\n\n**Pra ele gostar:** faz a lição "Tocar patas e orelhas" (Mundo 2) antes. Banho com lambedeira de pasta grudada no azulejo é mágica.${c.br({ pitbull:"Pitbull tem pele sensível: shampoo neutro/hipoalergênico e seca bem as dobrinhas.", malinois:"Pelo curto, fácil. Foco nas unhas: ele corre muito.", srd:"Depende do pelo dele. Pelo longo → escova mais." })}` });

  add({ id:"dentes", t:"Troca de dentes", kw:["troca de dente","dente caindo","dentinho","gengiva","dente de leite","nascendo dente"],
    a:(c)=>`A troca de dentes vai dos **4 aos 7 meses**. É normal ele:\n- Morder MUITO mais;\n- Ter um pouco de sangue nos brinquedos;\n- Engolir os dentinhos (sem problema).\n\n**Alívio:**\n1. Cenoura gelada (grande, pra não engasgar).\n2. Pano molhado torcido e congelado.\n3. Recheável com ração molhada congelada.\n4. Brinquedos de borracha macia.\n\nSe um dente de leite não cair e o permanente nascer do lado (dente duplo), mostra pro vet.` });

  add({ id:"lambe", t:"Lambe/coça muito", kw:["lambe","lambendo","coca","cocando","coceira","lambe a pata","morde a pata","alergia","feridas","perde pelo"],
    a:(c)=>`Lamber ou coçar muito pode ser **saúde** (alergia, pulga, fungo, dor) ou **comportamento** (tédio, ansiedade).\n\n1. **Vet primeiro** se tiver vermelhidão, ferida, queda de pelo, cheiro forte ou se ele não para.\n2. Confere pulgas/carrapatos e o antipulgas em dia.\n3. Seca bem as patas depois do passeio molhado.\n4. Se o vet descartar doença: mais atividade mental, mastigação e treino de calma.\n5. Interrompe com calma (chama, pede um comando, premia) em vez de brigar.${c.br({ pitbull:"Pitbull tem tendência a alergias de pele. Vet dermatologista pode ajudar muito.", pastor:"Pastor pode ter dermatites. Escovação ajuda a ver a pele." })}` });

  add({ id:"carro", t:"Carro / viagem", kw:["carro","viagem","viajar","enjoa","enjoo","vomita no carro","andar de carro","transporte","caixa de transporte","uber"],
    a:(c)=>`Pra ele curtir o carro:\n\n1. Carro **parado e desligado:** ele entra, ganha petisco, sai. 5 vezes.\n2. Come uma refeição dentro do carro parado.\n3. Liga o motor, petisco, desliga.\n4. Volta de 2 minutos no quarteirão → chega num lugar legal (parque, não só vet!).\n5. Aumenta o tempo aos poucos.\n\n**Enjoo:** jejum de 2–3h antes, janela um pouco aberta, olhando pra frente. Se vomitar sempre, o vet tem remédio.\n\n**Segurança:** cinto de segurança pet no peitoral ou caixa de transporte presa. Nunca solto no banco nem com a cabeça pra fora.` });

  add({ id:"crianca", t:"Criança e cão", kw:["crianca","criancas","bebe","filho","filha","neto","menino","menina"],
    a:(c)=>`Regras de ouro pra criança + cão:\n\n1. **Sempre com adulto olhando.** Sem exceção, mesmo o cão mais bonzinho.\n2. Criança **não abraça, não beija o rosto, não monta**, não mexe quando ele dorme ou come.\n3. Ensina a criança a dar petisco com a mão aberta e jogar no chão.\n4. Cão precisa de um **refúgio** onde a criança não entra (caixa, cercadinho).\n5. Criança pode participar do treino: dar "senta" e premiar, com tua ajuda.\n6. Sinais de que o cão quer sair: bocejo, lambe o focinho, vira a cabeça, olho arregalado. Hora de separar.\n\n**Bebê chegando?** Prepara antes: sons de choro baixinho com petisco, carrinho andando pela casa, cheiro das roupinhas.${c.br({ pastor:"Pastor costuma ser protetor da família: socializa com crianças visitantes também.", malinois:"Malinois e criança correndo = drive de presa ligado. Supervisão total e calma treinada.", pitbull:"Pitbull costuma amar criança, mas é forte: o 'não pular' é prioridade.", srd:"Cão adotado: deixa ele se adaptar antes de apresentar visitas mirins." })}` });

  add({ id:"gato", t:"Cão e gato", kw:["gato","gata","gatos","felino"],
    a:(c)=>`Apresentação cão × gato com calma:\n\n1. **Cheiro primeiro:** troca as caminhas/paninhos por uns dias.\n2. Separados por portãozinho ou porta com fresta. Cão olha pro gato com calma → petisco.\n3. Cão na guia, gato livre com rota de fuga e **lugares altos**.\n4. Encontros curtos, cão premiado por ignorar o gato e olhar pra ti.\n5. "Deixa" e "olha" muito bem treinados ajudam demais.\n6. Comida e caixa de areia do gato longe do cão.\n\nNunca deixa sozinhos até ter certeza absoluta (semanas ou meses).${c.br({ malinois:"Malinois e gato: drive de presa alto. Vai beeem devagar.", pitbull:"Pitbull pode conviver com gato se criado junto, mas supervisão é obrigatória." })}` });

  add({ id:"doiscaes", t:"Dois cães em casa", kw:["dois cachorros","outro cachorro","brigam","briga","ciumes","novo cachorro","segundo cao","os dois","irmaos"],
    a:(c)=>`Pra dois cães conviverem bem:\n\n1. **Recursos separados:** potes em cantos diferentes, ossos/mastigáveis cada um no seu espaço.\n2. **Treino individual:** cada um tem seu tempo contigo.\n3. Interrompe brincadeira que fica bruta: chama os dois, pede senta, premia, libera de novo.\n4. Brincadeira saudável tem pausas e troca de papéis (um persegue, depois o outro).\n5. **Apresentar novo cão:** em território neutro, andando em paralelo, guias frouxas.\n\n⚠️ Briga com ferimento: separa (nunca com a mão no meio — usa uma tábua/cadeira ou cobertor) e procura profissional.` });

  add({ id:"xixiemoc", t:"Xixi de emoção", kw:["xixi quando chega","faz xixi quando","xixi de alegria","xixi de medo","submissao","xixi quando faco carinho"],
    a:(c)=>`Xixi de emoção (alegria ou submissão) **não é falta de educação** e bronca piora.\n\n1. Chega em casa **sem festa**: ignora 2–3 min até ele acalmar.\n2. Cumprimenta agachado de lado, sem se debruçar por cima dele.\n3. Carinho no peito/queixo, não no topo da cabeça.\n4. Cumprimentos ao ar livre ajudam no começo.\n5. Joga petisco no chão quando chega: ele foca no petisco.\n\nA maioria supera com o amadurecimento.` });

  add({ id:"chora", t:"Chora pedindo atenção", kw:["choraminga","choro","chorando","resmunga","pede atencao","grita","chora no cercadinho","chora na caixa"],
    a:(c)=>`Se ele chora pedindo atenção (e tu já sabe que ele fez xixi, comeu e tá confortável):\n\n1. **Ignora o choro** totalmente. Nem olhar.\n2. **Premia o silêncio**: 3 segundos quieto → vai lá, petisco calmo.\n3. Aumenta o silêncio exigido aos poucos.\n4. Dá algo pra fazer: recheável, mordedor.\n5. Garante que as necessidades tão em dia antes (xixi, água, exercício).\n\n⚠️ Vai piorar antes de melhorar ("explosão de extinção"). Se tu ceder no auge, ensina ele a chorar mais. Aguenta firme!${c.ifPuppy("\n\nFilhote chorando de madrugada depois de horas dormindo: pode ser xixi de verdade. Leva sem festa e volta.")}` });

  add({ id:"teimoso", t:"Não obedece / teimoso", kw:["nao obedece","teimoso","teimosa","ignora","desobediente","nao me escuta","faz quando quer","burro","nao aprende","nao entende"],
    a:(c)=>`Cão "teimoso" quase sempre é uma dessas 4 coisas (e todas têm solução):\n\n1. **Não entendeu de verdade:** ele sabe na sala, mas não no quintal. Cão não generaliza fácil → treina em vários lugares (lição Comandos com distração).\n2. **Prêmio fraco:** a distração vale mais que o petisco. Sobe o nível do petisco.\n3. **Distração alta demais:** volta pra um lugar mais calmo, depois avança.\n4. **Comando virou ruído:** repetir "senta senta SENTA" ensina a ignorar. Fala UMA vez. Não fez? Ajuda com o gesto e facilita.\n\n**Teste rápido:** pede o comando em casa, sem distração, com petisco no bolso. Fez? Então ele sabe, o problema é distração/prêmio. Não fez? Volta pra lição na Trilha.${c.br({ malinois:"Malinois não é teimoso, ele é rápido: se o treino tá chato, ele inventa outra coisa. Sessões mais curtas e mais dinâmicas.", pitbull:"Pitbull é persistente: usa isso a teu favor com petiscos e cabo de guerra como prêmio.", pastor:"Pastor adolescente (6–18 meses) testa limites. Consistência e paciência.", srd:"Descobre o que ele MAIS ama (lição Descobrir o perfil) e usa como prêmio." })}` });

  add({ id:"punicao", t:"Posso brigar/corrigir?", kw:["bater","brigar","bronca","castigo","punir","punicao","enforcador","choque","coleira de choque","esfregar","jornal","dominancia","alfa","mostrar quem manda","gritar"],
    a:(c)=>`Aqui na Guaipecas a resposta é **não** — e não é só por ser "bonzinho", é porque **funciona pior**:\n\n- Punição ensina o que NÃO fazer, mas não ensina o que fazer.\n- Cria medo e desconfiança do tutor (ele faz escondido).\n- Aumenta o risco de agressividade (estudos mostram isso).\n- Enforcador e choque podem machucar traqueia, coluna e olhos.\n- "Dominância/alfa" é uma teoria antiga, já derrubada pela ciência.\n\n**O que fazer em vez disso:**\n1. **Prevenir** (manejo do ambiente).\n2. **Interromper** com algo neutro ("ei", chamar o nome).\n3. **Redirecionar** pro comportamento certo.\n4. **Premiar** o certo, muito.\n\nMe conta qual comportamento tá te tirando do sério que eu monto o plano. 💪` });

  add({ id:"saude", t:"Sinais de doença", kw:["vomito","vomitando","diarreia","sangue","mole","apatico","nao bebe","febre","mancando","manca","dor","convulsao","doente","tosse","espirro"],
    a:(c)=>`⚠️ **Isso é assunto pro veterinário**, não pro adestramento.\n\n**Vai HOJE se:**\n- Vômito ou diarreia repetidos (principalmente com sangue);\n- Muito mole, não come nem bebe;\n- Barriga inchada e dura, tentando vomitar sem sair nada (emergência!);\n- Dificuldade pra respirar, convulsão;\n- Comeu algo tóxico (chocolate, uva, remédio, veneno).\n${c.puppy ? "\n🚨 Filhote não vacinado com vômito/diarreia é **urgência** (risco de parvovirose).\n" : ""}\nMudança de comportamento do nada (agressividade, xixi fora, não quer andar) também pode ser dor. Vet primeiro, treino depois.` });

  add({ id:"raca", t:"Sobre a raça", kw:["raca","como e a raca","pastor alemao","malinois","pitbull","vira lata","srd","caracteristicas","temperamento","sobre ele"],
    a:(c)=>`**${c.B.name}**\n\n${c.B.about}\n\n**Pontos fortes:**\n${c.B.strengths.map((x) => "- " + x).join("\n")}\n\n**Fica de olho em:**\n${c.B.watch.map((x) => "- " + x).join("\n")}\n\n**Prêmios que funcionam:** ${c.B.rewards}\n**Exercício:** ${c.B.exercise}\n**Sessão ideal:** ${c.B.session} min.\n\nNo **Mundo 5** da Trilha tem lições feitas só pra raça dele.` });

  add({ id:"apto", t:"Cão em apartamento", kw:["apartamento","ape","sacada","varanda","condominio","elevador"],
    a:(c)=>`Dá pra criar ${c.B.short} em apartamento sim, se a **rotina** compensar o espaço:\n\n1. 2–3 passeios por dia (um deles longo, de cheirar).\n2. Faro e recheáveis todo dia.\n3. Xixi: tapete higiênico num canto fixo OU horários de rua bem definidos.\n4. **Elevador e corredor:** ensina "senta" e "espera" no elevador; premia ele calmo quando passa vizinho.\n5. Sacada com tela de proteção, SEMPRE.\n6. Latido: bloqueia visão da porta e trabalha alerta + silêncio.${c.br({ malinois:"Malinois em apê exige MUITO compromisso: 2h+ de atividade, a maior parte mental.", pastor:"Pastor em apê: passeios longos são obrigatórios e cuidado com escadas no 1º ano.", pitbull:"Pitbull se adapta bem a apê se gastar energia.", srd:"Vira-lata pequeno/médio costuma se dar super bem em apê." })}` });

  add({ id:"palavras", t:"Quais palavras usar", kw:["palavra","palavras","comando","comandos","qual palavra","ingles","sit","gesto","sinal"],
    a:(c)=>`Escolhe palavras **curtas e diferentes entre si**, e toda a família usa as mesmas:\n\n- **senta** · **deita** · **fica** · **livre** (soltura) · **vem** · **deixa** · **solta** · **olha** · **junto** · **lugar** · **pega** · **quieto** · **procura**\n\n**Marcador:** clique ou "Isso!" (sempre igual).\n\nPode ser em inglês, alemão, o que quiser — ele aprende o SOM. Só não muda depois. E evita palavras parecidas com o nome dele.` });

  add({ id:"dorme", t:"Sono", kw:["dorme muito","sono","dormir","dorme pouco","quantas horas dorme","nao dorme"],
    a:(c)=>`- Filhote: **18–20h** por dia.\n- Adulto: **12–14h**.\n- Idoso: mais ainda.\n\nCão que não dorme o suficiente fica mais mordedor, agitado e com menos paciência — igual criança sem soneca. ${c.puppy ? "Faz soneca forçada: depois de 1h acordado, cercadinho com mordedor e luz baixa." : ""}${c.br({ malinois:"Malinois muitas vezes não 'desliga' sozinho: treina o Botão de desligar e dá descanso forçado.", pastor:"Pastor filhote precisa de muito descanso pras articulações crescerem bem." })}` });

  window.GuaiBrain = {
    intents: I,
    /** constrói intenções a partir das lições da trilha (comandos) */
    lessonIntents(lessons) {
      return lessons.filter((l) => l.k !== "x").map((l) => ({
        id: "l_" + l.id, t: l.t, kw: [...(l.kw || []), norm(l.t)], lesson: l,
        a: (c) => {
          const why = c.puppy || !l.adult ? l.why : l.adult.why || l.why;
          if (l.k === "c") return `**${l.t}**\n\n${why}\n\nChecklist:\n${l.checks.map((x) => "- " + x).join("\n")}\n\n💡 ${l.tip}\n🚫 ${l.avoid}${l.br && l.br[c.breed] ? `\n\n🐕 **No caso do ${c.B.short}:** ${l.br[c.breed]}` : ""}\n\nAbre a lição na Trilha pra marcar os itens.`;
          return `**${l.t}** — ${why}\n\n**Passo a passo:**\n${l.steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n✅ **Pode avançar quando:** ${l.ok || "ele acertar 8 de 10."}\n💡 ${l.tip}\n🚫 **Evita:** ${l.avoid}${l.br && l.br[c.breed] ? `\n\n🐕 **No caso do ${c.B.short}:** ${l.br[c.breed]}` : ""}`;
        },
        deep: (c) => {
          const p = l.probs || [];
          return `Bora destravar o **${l.t}**:\n\n${p.length ? p.map(([q, a]) => `**❓ ${q}**\n${a}`).join("\n\n") + "\n\n" : ""}**Regras pra destravar qualquer comando:**\n1. Volta UMA etapa no passo a passo, onde ele acertava fácil.\n2. Sessão mais curta (${Math.max(2, c.B.session - 2)} min) e petisco melhor.\n3. Lugar mais calmo, sem ninguém passando.\n4. Divide a etapa em pedaços menores (ex: premia meio movimento).\n5. Termina sempre com algo que ele acerta.\n\nSe me contar **em qual passo ele trava** e **o que ele faz** em vez do certo, eu te digo exatamente o ajuste.`;
        },
      }));
    },
    ctxFor, learnFacts, memLines, norm, toks,

    /** pontua todas as intenções */
    rank(text, all, learned) {
      const n = " " + norm(text) + " ";
      const ts = toks(text);
      const raw = norm(text).split(/[^a-z0-9]+/).filter(Boolean);
      const out = [];
      for (const it of all) {
        let s = 0;
        for (const k of new Set(it.kw.map(norm))) {
          if (k.includes(" ")) { if (n.includes(" " + k + " ") || n.includes(" " + k)) s += 4; continue; }
          if (k.length <= 4) { if (raw.includes(k)) s += 2; continue; }
          const st = stem(k);
          if (ts.some((t) => t.startsWith(st))) s += 2;
        }
        for (const src of learned) {
          const syn = src.synonyms && src.synonyms[it.id];
          if (!syn) continue;
          for (const t of ts) { const w = syn[t.slice(0, 7)]; if (w) s += Math.min(w, 5) * (src.weight || 0.6); }
        }
        const v = learned[0] && learned[0].votes && learned[0].votes[it.id];
        if (v && s > 0) s *= 1 + ((v.up - v.down) / (v.up + v.down + 5)) * 0.3;
        if (it.small && s > 0) s -= 0.5;
        if (s > 0) out.push({ it, s });
      }
      return out.sort((a, b) => b.s - a.s);
    },

    custom(list) {
      return (list || []).map((c) => ({ id: c.id, t: c.q, kw: c.kw || [], custom: true, breed: c.breed || "", a: () => c.a }));
    },
  };
})();
