// ChatbotService - gestion sessions, messages, analyse symptômes via OpenAI (AIProvider)
const crypto = require("crypto");
const OpenAI = require("openai");
const AIAnalysisService = require("../services/AIAnalysisService");
const SemanticService   = require("../services/SemanticService");
const RAGService        = require("../services/RAGService");
const aiLogger = require("../utils/aiLogger");
const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const Recommendation = require("../models/Recommendation");
const Symptom = require("../models/Symptom");
const Patient = require("../models/Patient");

const DISCLAIMER =
  "Cette réponse est générée par une IA et ne constitue pas un diagnostic médical. Consultez un professionnel de santé pour un avis médical adapté à votre situation.";

const AI_MODEL = "gpt-4o-mini";

// Lazy initialization — crashes early with a clear message if API key is missing
let openai = null;
const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY manquant dans le fichier .env");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// ── Text normalization — strips accents, apostrophes, punctuation ─────────────
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")  // é→e, à→a, ç→c …
    .replace(/['’‘\-]/g, " ") // apostrophes + hyphens → space
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Local fallback responses (used ONLY when OpenAI is unavailable) ─────────
const LOCAL_RESPONSES = [
  {
    category: "douleur",
    keywords: [
      "douleur", "mal", "douleurs", "douloureux", "souffrance", "soulager",
      "souffre", "souffrir", "souffrez", "j'ai mal", "fait mal", "ça fait mal",
      "brûlure", "brûle", "crampe", "crampes", "élancement", "sensible",
      "gêne", "gênant", "inconfort", "endolori", "endolorie", "meurtri",
      "courbature", "lancinant", "lancinante", "tiraillement", "cuisson",
      "douleur au sein", "douleur poitrine", "douleur thoracique", "douleur au dos",
      "mal partout", "douleurs diffuses", "douleurs musculaires", "articulaire",
    ],
    response: `La douleur est l'un des symptômes les plus fréquents lors du traitement du cancer du sein. Voici quelques conseils pour la gérer :

**Médicaments** : Des antalgiques (paracétamol, ibuprofène) peuvent être prescrits par votre médecin selon l'intensité.
**Chaleur locale** : Une bouillotte tiède sur les zones douloureuses peut apporter du soulagement.
**Repos** : Accordez-vous des pauses régulières et évitez les efforts excessifs.
**Position** : En cas de douleur au niveau du sein, porter un soutien-gorge de soutien confortable aide.

Si la douleur est intense (≥ 7/10) ou persistante, contactez votre équipe médicale sans attendre.

${DISCLAIMER}`
  },
  {
    category: "fatigue",
    keywords: [
      "fatigue", "épuisement", "épuisé", "fatigué", "fatiguée", "énergie", "las", "lasse",
      "épuiser", "exténuée", "exténué", "sans force", "sans énergie", "vidée", "vidé",
      "crevée", "crevé", "alité", "alitée", "lourd", "lourde",
      "somnolence", "somnolent", "somnolente", "dormir tout le temps",
      "plus d'énergie", "plus de force", "je n'en peux plus", "à bout",
      "épuisante", "épuisant", "je suis à plat",
    ],
    response: `La fatigue liée au cancer (ou fatigue oncologique) est différente de la fatigue ordinaire — elle ne disparaît pas avec le repos seul. C'est le symptôme le plus reporté pendant les traitements.

**Conseils pratiques :**
- Planifiez vos activités aux moments où vous vous sentez le plus en forme (souvent le matin)
- Dormez à heures régulières, évitez les siestes trop longues (max 30 min)
- Une activité physique douce et régulière (marche 15–20 min/jour) réduit la fatigue à long terme
- Hydratez-vous bien (1,5 L d'eau par jour minimum)
- Acceptez l'aide de votre entourage pour les tâches quotidiennes

Parlez-en à votre oncologue si la fatigue interfère avec vos activités essentielles.

${DISCLAIMER}`
  },
  {
    category: "nausée",
    keywords: [
      "nausée", "nausées", "vomissement", "vomissements", "vomis", "envie de vomir",
      "vomir", "haut-le-cœur", "haut le cœur", "mal au cœur", "cœur qui tourne",
      "nauséeux", "nauséeuse", "régurgitation", "reflux", "estomac retourné",
      "je vomis", "j'ai vomi", "mal à l'estomac", "nauseux",
    ],
    response: `Les nausées et vomissements sont fréquents, surtout durant la chimiothérapie. Des médicaments antiémétiques très efficaces existent — n'hésitez pas à les demander à votre médecin.

**Entre les traitements :**
- Mangez en petites quantités, souvent (5–6 repas légers par jour)
- Préférez les aliments froids ou à température ambiante (les odeurs de cuisson aggravent les nausées)
- Évitez les aliments gras, épicés ou sucrés
- Le gingembre (thé, biscuits) a des propriétés antiémétiques naturelles
- Reposez-vous après les repas, la tête légèrement surélevée

Si vous vomissez plus de 3 fois en 24h ou si vous ne pouvez rien garder, consultez en urgence pour éviter la déshydratation.

${DISCLAIMER}`
  },
  {
    category: "insomnie",
    keywords: [
      "insomnie", "dormir", "sommeil", "nuit", "réveil", "endormir",
      "nuit blanche", "nuits blanches", "je ne dors pas", "je ne dors plus",
      "impossible de dormir", "du mal à dormir", "je n'arrive pas à dormir",
      "réveillée la nuit", "me réveille", "cauchemar", "cauchemars",
      "insomnique", "sommeil agité", "sommeil perturbé", "veille", "veiller",
    ],
    response: `Les troubles du sommeil touchent environ 50% des personnes en traitement oncologique. Ils peuvent être causés par l'anxiété, les médicaments ou les douleurs.

**Hygiène du sommeil :**
- Couchez-vous et levez-vous à heures fixes
- Évitez les écrans (téléphone, TV) 1h avant de dormir
- La chambre doit être fraîche (18–20°C), sombre et silencieuse
- Des techniques de relaxation (respiration profonde, méditation guidée) aident à l'endormissement
- Évitez la caféine après 14h

**Si les troubles persistent :**
Une thérapie cognitivo-comportementale pour l'insomnie (TCC-I) est la méthode la plus efficace à long terme. Demandez une orientation à votre médecin.

${DISCLAIMER}`
  },
  {
    category: "appétit",
    keywords: [
      "appétit", "manger", "alimentation", "nourriture", "repas", "poids", "amaigrissement", "maigrir",
      "je ne mange plus", "je ne mange pas", "plus faim", "pas faim",
      "perte de poids", "je maigris", "dégoût alimentaire", "rien avaler",
      "anorexie", "anorexique", "manque d'appétit", "perte d'appétit",
      "difficulté à manger", "ne supporte pas manger", "avaler",
    ],
    response: `La perte d'appétit est courante lors des traitements du cancer. Maintenir une bonne nutrition est important pour votre énergie et votre guérison.

**Stratégies pour manger malgré l'appétit réduit :**
- Petites portions fréquentes (toutes les 2–3h) plutôt que 3 grands repas
- Enrichissez les plats : ajoutez du beurre, de la crème, du fromage, des œufs pour augmenter les calories
- Les smoothies, yaourts et soupes permettent d'apporter des nutriments sans effort
- Choisissez des aliments que vous aimez, pas ceux que vous "devriez" manger
- Mangez dans un environnement agréable, avec de la compagnie si possible

Si vous perdez plus de 5% de votre poids en un mois, signalez-le à votre équipe médicale — une consultation diététique peut être proposée.

${DISCLAIMER}`
  },
  {
    category: "essoufflement",
    keywords: [
      "essoufflement", "respiration", "souffle", "haleine", "respirer", "poumon",
      "manque de souffle", "souffle court", "dyspnée", "du mal à respirer",
      "difficulté à respirer", "j'étouffe", "oppression", "gorge serrée",
      "suffoque", "suffoquer", "haleter", "haletant", "manque d'air",
      "souffle coupé", "je n'arrive pas à respirer",
    ],
    response: `L'essoufflement (dyspnée) peut avoir plusieurs causes chez les patientes traitées pour un cancer du sein : anémie, anxiété, épanchement pleural ou effets du traitement.

**Mesures immédiates :**
- Installez-vous en position semi-assise (dos surélevé)
- Respirez lentement et profondément par le nez, expirez par la bouche
- Ouvrez une fenêtre pour aérer la pièce
- Évitez les efforts brusques

**Consultez rapidement si :**
- L'essoufflement est soudain ou s'aggrave rapidement
- Il est accompagné de douleur thoracique ou de palpitations
- Vous êtes essoufflée au repos

Dans ces cas, il peut s'agir d'une urgence médicale nécessitant une évaluation immédiate.

${DISCLAIMER}`
  },
  {
    category: "traitement",
    keywords: [
      "chimio", "chimiothérapie", "traitement", "radiothérapie", "hormonothérapie", "immunothérapie",
      "séance", "protocole", "perfusion", "anticancéreux", "cure", "cycles",
      "effets secondaires", "effet secondaire", "ma chimio", "la chimio",
      "irradiation", "rayonnement", "tamoxifène", "mon traitement",
      "chimioth", "radioth", "hormonoth",
    ],
    response: `Les traitements du cancer du sein (chimiothérapie, radiothérapie, hormonothérapie) peuvent provoquer des effets secondaires variés. La bonne nouvelle : il existe des solutions pour les gérer.

**Effets fréquents et leur gestion :**
- **Chute de cheveux** : temporaire pour la chimio, souvent complète en 2–3 mois après l'arrêt
- **Fatigue** : activité physique douce, gestion de l'énergie
- **Nausées** : médicaments antiémétiques, alimentation adaptée
- **Mucites** (aphtes) : bains de bouche réguliers, alimentation molle
- **Baisse de l'immunité** : éviter les foules et les personnes malades pendant les aplasies

Chaque patiente réagit différemment aux traitements. Notez vos symptômes dans un journal pour en parler à votre équipe lors de chaque consultation.

${DISCLAIMER}`
  },
  {
    category: "anxiété",
    keywords: [
      "anxiété", "anxieux", "anxieuse", "peur", "stress", "inquiète", "inquiet", "angoisse", "déprime", "moral",
      "tristesse", "triste", "pleurer", "pleure", "larmes", "je pleure",
      "j'ai peur", "panique", "paniquée", "crise d'angoisse", "angoisser",
      "dépression", "dépressive", "dépressif", "mélancolie",
      "cafard", "pas le moral", "désespoir", "perdre espoir", "plus envie",
      "peur de mourir", "peur de rechuter", "je vais mal", "mal dans ma peau",
    ],
    response: `Il est tout à fait normal de ressentir de l'anxiété, de la peur ou de la tristesse face au cancer. Ces émotions font partie du parcours et méritent autant d'attention que les symptômes physiques.

**Ce qui peut aider :**
- **Parler** : à votre famille, vos amis, ou à un psychologue spécialisé en oncologie
- **Groupes de soutien** : rencontrer d'autres patientes partageant la même expérience est souvent très bénéfique
- **Relaxation** : méditation, yoga doux, respiration guidée
- **Activités plaisantes** : lire, écouter de la musique, jardiner — tout ce qui vous fait du bien
- **Information** : comprendre son traitement réduit souvent l'anxiété liée à l'inconnu

Un soutien psychologique professionnel est remboursé dans le cadre du parcours oncologique — n'hésitez pas à en demander un.

${DISCLAIMER}`
  },
  {
    category: "stade",
    keywords: [
      "stade", "pronostic", "guérison", "survie", "métastase",
      "stade 1", "stade 2", "stade 3", "stade 4", "stade i", "stade ii", "stade iii", "stade iv",
      "grade", "grade tumeur", "chances de guérison", "taux de survie",
      "rechute", "récidive", "cancer généralisé", "ganglion", "ganglions",
      "curage ganglionnaire", "espérance de vie",
    ],
    response: `Le stade du cancer détermine l'étendue de la maladie et guide les décisions de traitement. Les stades vont de I (très localisé) à IV (avec métastases).

**Taux de survie à 5 ans (données générales) :**
- Stade I : > 95%
- Stade II : 80–90%
- Stade III : 50–70%
- Stade IV : variable, mais les traitements s'améliorent constamment

Ces chiffres sont des statistiques générales — ils ne prédisent pas ce qui se passera pour vous individuellement. Chaque cas est unique et les avancées thérapeutiques sont constantes.

Votre oncologue est la meilleure personne pour vous donner une information personnalisée sur votre situation.

${DISCLAIMER}`
  },
  {
    category: "compréhension",
    keywords: [
      "signifient", "signifie", "veut dire", "comprendre", "expliquer", "pourquoi",
      "qu'est-ce que", "c'est quoi", "que veut dire", "est-ce normal", "c'est grave",
      "est-ce grave", "est-ce dangereux", "je ne comprends pas", "explication",
      "c'est normal", "normal de ressentir",
    ],
    response: `C'est tout à fait légitime de vouloir comprendre ce que signifient vos symptômes. Voici quelques points généraux :

**Principes importants :**
- Un symptôme isolé n'est pas nécessairement alarmant — le contexte et l'évolution dans le temps comptent
- L'intensité et la durée d'un symptôme sont des informations clés pour votre médecin
- Certains symptômes sont liés aux traitements (effets secondaires normaux), d'autres peuvent signaler une complication
- Tenir un journal des symptômes (type, intensité, moment) aide énormément lors des consultations

**Quand consulter sans attendre :**
- Fièvre ≥ 38,5°C (risque d'infection en période d'aplasie)
- Douleur thoracique ou essoufflement soudain
- Tout symptôme nouveau et inhabituel qui vous inquiète

N'hésitez jamais à appeler votre équipe médicale en cas de doute.

${DISCLAIMER}`
  },
  {
    category: "urgence",
    keywords: [
      "préoccupant", "grave", "danger", "urgent", "urgence", "inquiétant",
      "fièvre", "température élevée", "saignement", "saigne", "sang",
      "gonflement", "gonfle", "enfle", "œdème", "hématome",
      "confusion", "désorientée", "désorientation", "chute",
      "palpitations", "cœur qui bat vite", "très grave", "très urgent",
    ],
    response: `Certains symptômes nécessitent une attention médicale rapide. Voici les signes d'alerte à surveiller :

**Consultez en urgence si vous avez :**
- Fièvre ≥ 38,5°C (surtout sous chimiothérapie)
- Essoufflement soudain ou douleur thoracique
- Saignement inhabituel abondant
- Douleur intense non soulagée par les antalgiques habituels
- Confusion, maux de tête sévères, ou troubles visuels
- Gonflement important et douloureux d'un membre

**À signaler lors de votre prochaine consultation :**
- Nausées ou vomissements persistants
- Fatigue qui s'aggrave progressivement
- Perte de poids non intentionnelle

En cas de doute, il vaut toujours mieux appeler votre équipe soignante — ils préfèrent être contactés pour un faux problème que de manquer une vraie urgence.

${DISCLAIMER}`
  },
];

// ── Symptom category detector — normalized + scored keyword matching ──────────
/**
 * Detects which medical topic best matches the user message.
 * Scores each LOCAL_RESPONSES entry using normalized text comparison:
 *   3 pts — exact word match or multi-word phrase found
 *   2 pts — user word starts with keyword stem (≥4 chars)
 *   1 pt  — keyword starts with user word (≥4 chars, partial)
 * Returns the highest-scoring entry, or null if nothing matched.
 */
function detectSymptomCategory(userMessage) {
  const normalized = normalizeText(userMessage);
  const words = normalized.split(/\s+/);

  let bestEntry = null;
  let bestScore = 0;

  for (const entry of LOCAL_RESPONSES) {
    let score = 0;
    for (const kw of entry.keywords) {
      const nkw = normalizeText(kw);
      if (!nkw) continue;

      if (nkw.includes(" ")) {
        // Multi-word phrase — check presence in the full normalized text
        if (normalized.includes(nkw)) score += 3;
      } else if (words.includes(nkw)) {
        score += 3; // Exact word match
      } else if (nkw.length >= 4 && words.some((w) => w.startsWith(nkw))) {
        score += 2; // "fatigues" → matches "fatigu" stem
      } else if (nkw.length >= 5 && words.some((w) => nkw.startsWith(w) && w.length >= 4)) {
        score += 1; // "chimioth" → matches "chimio"
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestScore > 0 ? bestEntry : null;
}

// ─── Local preliminary analysis (no OpenAI needed) ───────────────────────────

function generateLocalAnalysis(symptoms) {
  if (!symptoms || symptoms.length === 0) {
    return `Bonjour. Je suis votre assistante médicale IA. Aucun symptôme n'a été renseigné pour cette session.\n\nN'hésitez pas à déclarer vos symptômes afin que je puisse vous accompagner au mieux.\n\n${DISCLAIMER}`;
  }

  const maxIntensity = Math.max(...symptoms.map((s) => s.intensite));
  const avgIntensity = (symptoms.reduce((a, s) => a + s.intensite, 0) / symptoms.length).toFixed(1);

  // Severity level
  let niveauTitre, niveauDesc;
  if (maxIntensity >= 8) {
    niveauTitre = "Attention — intensité élevée";
    niveauDesc  = "Certains de vos symptômes présentent une intensité importante. Je vous recommande d'en informer votre équipe médicale lors de votre prochaine consultation, ou plus tôt si l'intensité augmente.";
  } else if (maxIntensity >= 5) {
    niveauTitre = "Surveillance recommandée";
    niveauDesc  = "Vos symptômes sont d'intensité modérée. Continuez à les surveiller quotidiennement et notez toute évolution. Une discussion avec votre médecin lors du prochain rendez-vous est conseillée.";
  } else {
    niveauTitre = "Situation globalement stable";
    niveauDesc  = "Vos symptômes semblent bien maîtrisés pour le moment. Continuez votre suivi habituel et n'hésitez pas à signaler tout changement.";
  }

  // Symptom lines
  const lines = symptoms
    .map((s) => {
      const label = s.intensite >= 8 ? "sévère" : s.intensite >= 5 ? "modéré" : "léger";
      return `  • ${s.type} — ${s.intensite}/10 (${label})`;
    })
    .join("\n");

  // Gentle recommendations based on symptoms present
  const recs = [];
  const types = symptoms.map((s) => s.type.toLowerCase());
  if (types.some((t) => t.includes("douleur")))        recs.push("Discutez de la gestion de la douleur avec votre médecin (antalgiques adaptés, chaleur locale).");
  if (types.some((t) => t.includes("fatigue")))         recs.push("Ménagez-vous des temps de repos réguliers et limitez les efforts superflus.");
  if (types.some((t) => t.includes("nausée") || t.includes("vomissement"))) recs.push("Fractionnez vos repas en petites portions et évitez les odeurs fortes.");
  if (types.some((t) => t.includes("insomnie")))        recs.push("Maintenez des horaires de sommeil réguliers ; des techniques de relaxation peuvent aider.");
  if (types.some((t) => t.includes("appétit")))         recs.push("Privilégiez des aliments nutritifs et faciles à consommer (smoothies, soupes enrichies).");
  if (types.some((t) => t.includes("essoufflement")))   recs.push("En cas d'essoufflement au repos ou soudain, contactez votre équipe médicale sans délai.");
  if (recs.length === 0) recs.push("Continuez votre suivi médical habituel et signalez tout nouveau symptôme.");

  const recsText = recs.map((r) => `  • ${r}`).join("\n");

  return `Analyse préliminaire — ${symptoms.length} symptôme${symptoms.length > 1 ? "s" : ""} analysé${symptoms.length > 1 ? "s" : ""}

Niveau d'attention : ${niveauTitre}
Intensité moyenne : ${avgIntensity}/10   |   Intensité maximale : ${maxIntensity}/10

${niveauDesc}

Symptômes signalés :
${lines}

Recommandations douces :
${recsText}

Je reste disponible pour répondre à toutes vos questions sur ces symptômes ou sur votre parcours de soins.

${DISCLAIMER}`;
}

function localFallbackResponse(userMessage) {
  const match = detectSymptomCategory(userMessage);
  if (match) return match.response;
  // Generic fallback
  return `Merci pour votre question. Je suis votre assistante médicale spécialisée en oncologie, et je suis là pour vous accompagner.

Pour vous apporter une réponse précise et personnalisée, je vous encourage à :
- **Décrire vos symptômes** plus précisément (localisation, intensité, durée)
- **Poser une question spécifique** sur la douleur, la fatigue, les nausées, le traitement, l'anxiété, ou votre alimentation
- **Contacter directement votre équipe médicale** pour toute préoccupation urgente

Je suis là pour vous aider dans votre parcours de soins.

${DISCLAIMER}`;
}

// ─── AI Classification + Medical Reasoning ───────────────────────────────────

/**
 * classifySymptoms — uses OpenAI to extract symptoms and severity from free text.
 * Falls back to keyword heuristics if OpenAI is unavailable.
 * @returns {{ symptoms: string[], severity: "low"|"moderate"|"high"|"critical", confidence: number }}
 */
async function classifySymptoms(userMessage, history) {
  const historyContext = history
    .slice(-6)
    .map((m) => `${m.role === "patient" ? "Patient" : "Assistant"}: ${m.contenu.slice(0, 120)}`)
    .join("\n");

  const prompt = `Tu es un système de classification médicale spécialisé en oncologie du sein.
Analyse le message de la patiente et extrait les symptômes mentionnés.

${historyContext ? `Contexte récent de la conversation :\n${historyContext}\n` : ""}
Message actuel : "${userMessage}"

Réponds UNIQUEMENT en JSON strict (sans markdown, sans explication) :
{"symptoms":["symptôme 1","symptôme 2"],"severity":"low|moderate|high|critical","confidence":0.0}

Règles de sévérité :
- "critical" : douleur thoracique intense, essoufflement soudain, fièvre ≥38.5°C sous chimio, saignement abondant, confusion, chute brutale
- "high"     : douleur ≥7/10, vomissements répétés, fatigue extrême, enflure importante
- "moderate" : douleur 4-6/10, nausées gérables, insomnie, perte d'appétit, anxiété
- "low"      : symptômes légers, question générale, soutien émotionnel, information`;

  const completion = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0.1,
  });

  const text = completion.choices[0].message.content;

  // Extract the first {...} block from the response — handles cases where
  // the model wraps JSON in markdown or adds explanatory text around it
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in classifier response: " + text.slice(0, 100));

  const parsed = JSON.parse(match[0]);

  // Validate shape — reject if required fields are missing
  if (!parsed.severity || typeof parsed.confidence !== "number") {
    throw new Error("Classifier returned invalid shape: " + match[0]);
  }

  return {
    symptoms:   Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
    severity:   parsed.severity,
    confidence: parsed.confidence,
  };
}

/**
 * generateMedicalResponse — structured clinical response using classification + history.
 */
async function generateMedicalResponse(userMessage, classification, history, sessionType) {
  const historyContext = history
    .slice(-10)
    .map((m) => ({
      role: m.role === "patient" ? "user" : "assistant",
      content: m.contenu,
    }));

  const classNote = classification
    ? `\nSymptômes détectés par analyse IA : ${classification.symptoms.join(", ") || "non spécifié"} | Sévérité : ${classification.severity} | Confiance : ${(classification.confidence * 100).toFixed(0)}%`
    : "";

  const { severity, confidence } = classification || {};

  const urgencyNote = severity === "critical"
    ? "\n⚠️ URGENCE DÉTECTÉE : insiste fortement et clairement sur la nécessité de contacter l'équipe médicale IMMÉDIATEMENT. Mentionne explicitement la prise de rendez-vous."
    : (severity === "high" || confidence < 0.6)
      ? "\n📋 CONSULTATION RECOMMANDÉE : suggère naturellement et avec empathie de consulter un médecin ou de prendre rendez-vous pour une évaluation plus précise. Ne soit pas alarmant."
      : "";

  const systemPrompt = `${buildSystemPrompt(sessionType)}${classNote}${urgencyNote}

Raisonnement clinique structuré à suivre :
1. Reconnaître et valider ce que la patiente exprime, en comprenant le sens au-delà des mots
2. Expliquer simplement ce que ces symptômes peuvent signifier dans son contexte oncologique
3. Donner 2-3 recommandations pratiques et concrètes
4. Si la sévérité est élevée ou la situation incertaine, suggérer de prendre rendez-vous avec son médecin
5. Rester empathique, rassurant et sans alarmisme inutile`;

  const completion = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...historyContext,
      { role: "user", content: userMessage },
    ],
    max_tokens: 600,
    temperature: 0.6,
  });

  return completion.choices[0].message.content;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

// POST /api/chat/sessions
exports.createSession = async (req, res) => {
  try {
    const { type } = req.body;
    const session = await ChatSession.create({
      patientId: req.user.id,
      type: type || "general_support",
      dateDebut: new Date()
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/chat/sessions
// ?all=true → returns all sessions (history); default → only open sessions
exports.getMySessions = async (req, res) => {
  try {
    const filter = { patientId: req.user.id };
    if (!req.query.all) filter.datefin = { $in: [null, undefined] };
    const sessions = await ChatSession.find(filter).sort({ dateDebut: -1 }).limit(20);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/chat/sessions/:id/close
exports.closeSession = async (req, res) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      { datefin: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: "Session introuvable" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── Messages + réponse IA ────────────────────────────────────────────────────

// POST /api/chat/sessions/:id/messages
exports.sendMessage = async (req, res) => {
  // Debug context — populated at each step, dumped to console on error
  let _debug = { contenu: null, classification: null, aiResult: null, finalResponse: null };

  try {
    const { contenu } = req.body;
    if (!contenu) return res.status(400).json({ message: "Le message ne peut pas être vide" });

    _debug.contenu = contenu;
    console.log("Incoming message:", contenu);

    // ── Category detection (sync, no API call) ────────────────────────────────
    const detectedEntry    = detectSymptomCategory(contenu);
    const detectedCategory = detectedEntry?.category ?? null;
    if (detectedCategory) console.log("Detected category:", detectedCategory);

    const session = await ChatSession.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!session) return res.status(404).json({ message: "Session introuvable" });
    if (session.datefin) return res.status(400).json({ message: "Session terminée" });

    // Save patient message
    await ChatMessage.create({ sessionId: session._id, contenu, role: "patient" });

    // Fetch conversation history
    const history = await ChatMessage.find({ sessionId: session._id })
      .sort({ dateEnvoi: 1 })
      .limit(20);

    const sessionId = session._id.toString();
    aiLogger.log("user_input", { sessionId, contentLength: contenu.length, preview: contenu.slice(0, 200) });

    // ── Step 0: Semantic Similarity Lookup ────────────────────────────────────
    let semanticCtx = { tier: "none", context: null, score: 0 };
    try {
      semanticCtx = await SemanticService.findSemanticContext(contenu, req.user.id);
      aiLogger.log("semantic_lookup", { tier: semanticCtx.tier, score: semanticCtx.score?.toFixed(4) }, { sessionId });
    } catch (err) {
      aiLogger.logError("semantic_lookup_failed", err, { sessionId });
    }
    console.log("Semantic lookup:", { tier: semanticCtx.tier, score: semanticCtx.score?.toFixed(4) });

    // ── Step 0.5: RAG Retrieval — medical knowledge base ─────────────────────
    let ragChunks = [];
    try {
      ragChunks = await RAGService.retrieveRelevantChunks(contenu, 4);
      aiLogger.log("rag_retrieval", {
        count:    ragChunks.length,
        topScore: ragChunks[0]?.score?.toFixed(4) ?? "n/a",
        sources:  ragChunks.map((c) => c.sourceFile),
      }, { sessionId });
    } catch (err) {
      aiLogger.logError("rag_retrieval_failed", err, { sessionId });
    }

    // ── Step 1: AI Symptom Classification ────────────────────────────────────
    let classification;
    try {
      classification = await AIAnalysisService.classifySymptoms(contenu, history);
      aiLogger.log("classification", classification, { sessionId });
    } catch (err) {
      aiLogger.logError("classification_failed", err, { sessionId });
      // Fallback metadata — pipeline continues with degraded confidence
      classification = { symptoms: [], severity: "moderate", confidence: 0.3 };
    }
    _debug.classification = classification;
    console.log("Classification:", classification);

    // ── Step 2: Safety assessment ─────────────────────────────────────────────
    const needsConsultation =
      semanticCtx.tier === "medium" ||
      ["high", "critical"].includes(classification.severity) ||
      classification.confidence < 0.5;

    const safety = AIAnalysisService.applySafetyFilter(classification);
    aiLogger.log("safety_filter", safety, { sessionId });

    // ── Step 3: Conversational response with full memory ──────────────────────
    let finalResponse;
    try {
      finalResponse = await AIAnalysisService.generateConversationalResponse(classification, {
        userMessage:      contenu,
        history,
        ragChunks,
        semanticContext:  semanticCtx.context,
        semanticTier:     semanticCtx.tier,
        needsConsultation,
        detectedCategory,
        safety,
      });
      aiLogger.log("conversational_response", {
        responseLength: finalResponse.length,
        preview:        finalResponse.slice(0, 150),
      }, { sessionId });
    } catch (err) {
      aiLogger.logError("conversational_response_failed", err, { sessionId });
      finalResponse = localFallbackResponse(contenu);
    }
    _debug.finalResponse = finalResponse;

    aiLogger.log("final_response", {
      requiresEscalation: safety.requiresEscalation,
      responseLength:     finalResponse.length,
      preview:            finalResponse.slice(0, 120),
    }, { sessionId });

    // ── Step 5: Metadata enrichment + save ───────────────────────────────────
    const metadata = {
      confidence: classification.confidence,
      severity:   classification.severity,
      symptoms:   classification.symptoms,
    };

    const botMessage = await ChatMessage.create({
      sessionId: session._id,
      contenu:   finalResponse,
      role:      "assistant_ia",
      metadata,
    });

    aiLogger.logPipelineSummary({
      sessionId,
      severity:           classification.severity,
      confidence:         classification.confidence,
      requiresEscalation: safety.requiresEscalation,
      responseLength:     finalResponse.length,
    });

    res.json({
      response:            botMessage,
      metadata,
      requiresEscalation:  safety.requiresEscalation,
      suggestsAppointment: safety.suggestsAppointment || false,
    });
  } catch (err) {
    console.error("=== sendMessage pipeline error ===");
    console.error("Error:", err.message);
    console.error("Incoming message:", _debug.contenu);
    console.error("Classification:", _debug.classification);
    console.error("AI result:", _debug.aiResult);
    console.error("Final response:", _debug.finalResponse);
    console.error("==================================");
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/chat/sessions/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!session) return res.status(404).json({ message: "Session introuvable" });

    const messages = await ChatMessage.find({ sessionId: session._id }).sort({ dateEnvoi: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── Analyse symptômes → recommandations IA ──────────────────────────────────

// POST /api/chat/analyser-symptomes
exports.analyserSymptomes = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("-motDePasse");
    if (!patient) return res.status(404).json({ message: "Patient introuvable" });

    const symptoms = await Symptom.find({ patientId: req.user.id }).sort({ dateDeclaration: -1 }).limit(10);
    if (!symptoms.length) {
      return res.status(400).json({ message: "Aucun symptôme enregistré pour l'analyse" });
    }

    const symptomList = symptoms
      .map((s) => `- ${s.type} (intensité: ${s.intensite}/10)`)
      .join("\n");

    const prompt = `Tu es un assistant médical spécialisé en oncologie.
Patiente : ${patient.nom}, stade cancer : ${patient.stadeCancer || "non renseigné"}.
Symptômes récents :\n${symptomList}
Génère des recommandations médicales claires et prioritaires. Format: JSON avec "recommandations" array où chaque item a "contenu" et "niveauPriorite" (faible|modere|eleve|urgent).`;

    let parsed;
    try {
      const completion = await getOpenAI().chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.3
      });
      try {
        parsed = JSON.parse(completion.choices[0].message.content);
      } catch {
        parsed = { recommandations: [{ contenu: completion.choices[0].message.content, niveauPriorite: "modere" }] };
      }
    } catch {
      // Local fallback recommendations based on declared symptoms
      parsed = {
        recommandations: symptoms.map((s) => ({
          contenu: localFallbackResponse(s.type),
          niveauPriorite: s.intensite >= 8 ? "urgent" : s.intensite >= 5 ? "eleve" : "modere"
        }))
      };
    }

    const saved = await Promise.all(
      parsed.recommandations.map((r) =>
        Recommendation.create({
          patientId: req.user.id,
          symptomId: symptoms[0]._id,
          contenu: r.contenu,
          niveauPriorite: r.niveauPriorite || "modere"
        })
      )
    );

    // Fire-and-forget: compute and store embeddings on each new recommendation
    (async () => {
      for (const rec of saved) {
        try {
          const emb = await SemanticService.generateEmbedding(rec.contenu);
          await Recommendation.findByIdAndUpdate(rec._id, { embedding: emb });
        } catch { /* ignore — non-blocking */ }
      }
    })();

    res.json({ recommandations: saved });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── POST /api/chat/initialize ────────────────────────────────────────────────
exports.initializeWithSymptoms = async (req, res) => {
  try {
    const { symptoms = [] } = req.body;

    const session = await ChatSession.create({
      patientId: req.user.id,
      type: "analyseSymptome",
      dateDebut: new Date(),
    });

    // Generate preliminary analysis locally (always works, no API needed)
    let analysis = generateLocalAnalysis(symptoms);

    // Build symptom-aware suggestions locally
    let suggestions = ["Que signifient ces symptômes ?", "Ces symptômes sont-ils préoccupants ?", "Que puis-je faire pour me soulager ?"];
    if (symptoms.length > 0) {
      const types = symptoms.map((s) => s.type.toLowerCase());
      const custom = [];
      if (types.some((t) => t.includes("douleur")))   custom.push("Comment soulager mes douleurs ?");
      if (types.some((t) => t.includes("fatigue")))    custom.push("Comment gérer ma fatigue ?");
      if (types.some((t) => t.includes("nausée") || t.includes("vomissement"))) custom.push("Comment réduire mes nausées ?");
      if (types.some((t) => t.includes("insomnie")))   custom.push("Comment améliorer mon sommeil ?");
      if (types.some((t) => t.includes("appétit")))    custom.push("Comment maintenir mon alimentation ?");
      if (types.some((t) => t.includes("essoufflement"))) custom.push("Mon essoufflement est-il préoccupant ?");
      const defaults = ["Que signifient ces symptômes ?", "Ces symptômes sont-ils graves ?", "Que puis-je faire pour me soulager ?"];
      while (custom.length < 3) { const n = defaults.find((d) => !custom.includes(d)); if (n) custom.push(n); else break; }
      if (custom.length >= 3) suggestions = custom.slice(0, 3);
    }

    // Try to generate a richer AI analysis via OpenAI
    if (process.env.OPENAI_API_KEY && symptoms.length > 0) {
      try {
        const symptomText = symptoms.map((s) => `${s.type} (intensité: ${s.intensite}/10)`).join(", ");
        const completion = await getOpenAI().chat.completions.create({
          model: AI_MODEL,
          messages: [{
            role: "user",
            content: `Tu es une assistante médicale IA spécialisée en oncologie du sein. Une patiente déclare les symptômes suivants : ${symptomText}.

Génère en JSON strict (sans balises markdown) :
1. "analysis": une analyse préliminaire empathique et non alarmante (3-5 phrases) incluant : niveau d'attention global, brève description des symptômes, et 2-3 recommandations douces. Ne pose jamais de diagnostic.
2. "suggestions": 3 questions courtes que la patiente pourrait vouloir poser.

Format exact : { "analysis": "...", "suggestions": ["q1", "q2", "q3"] }`
          }],
          max_tokens: 500,
          temperature: 0.5,
        });
        const raw = completion.choices[0].message.content.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(raw);
        if (parsed.analysis) analysis = parsed.analysis + "\n\n" + DISCLAIMER;
        if (Array.isArray(parsed.suggestions) && parsed.suggestions.length === 3) suggestions = parsed.suggestions;
      } catch {
        // Keep local analysis
      }
    }

    // Save analysis as first bot message in the session
    await ChatMessage.create({ sessionId: session._id, contenu: analysis, role: "assistant_ia" });

    // Return both keys: ChatbotAI.js reads `welcome`, Symptoms.js reads `analysis`
    res.json({ session, welcome: analysis, analysis, suggestions });
  } catch (err) {
    console.error("[initialize] Error:", err.message, err.stack?.split("\n")[1]);
    res.status(500).json({ message: err.message, error: err.message });
  }
};

// ─── DELETE /api/chat/sessions/:id ───────────────────────────────────────────
exports.deleteSession = async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
    if (!session) return res.status(404).json({ message: "Session introuvable" });
    await ChatMessage.deleteMany({ sessionId: req.params.id });
    res.json({ message: "Session supprimée." });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── POST /api/chat/sessions/:id/share ───────────────────────────────────────
exports.shareSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!session) return res.status(404).json({ message: "Session introuvable" });

    if (!session.shareToken) {
      session.shareToken = crypto.randomBytes(20).toString("hex");
      await session.save();
    }

    res.json({ shareToken: session.shareToken });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── GET /api/chat/share/:token (public — no auth) ───────────────────────────
exports.getSharedSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ shareToken: req.params.token });
    if (!session) return res.status(404).json({ message: "Lien invalide ou expiré" });

    const messages = await ChatMessage.find({ sessionId: session._id })
      .sort({ dateEnvoi: 1 })
      .select("contenu role dateEnvoi metadata");

    res.json({ session: { type: session.type, dateDebut: session.dateDebut }, messages });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(sessionType) {
  const base = `Tu es Sophie, une assistante médicale chaleureuse et bienveillante spécialisée en oncologie du sein, au sein de l'application CalmCare.
Tu t'exprimes en français, de façon naturelle et humaine — comme une professionnelle de santé attentionnée qui prend le temps d'écouter vraiment.

STYLE DE COMMUNICATION (très important) :
- Parle de façon naturelle et chaleureuse, jamais froide, jamais robotique, jamais comme une liste de procédures
- Utilise "je" pour t'exprimer personnellement : "je comprends", "je vous conseille", "je vous entends"
- Commence toujours par reconnaître ce que la patiente ressent ou vit avant de donner des informations
- Varie tes formulations — évite les listes à puces systématiques, préfère des paragraphes courts et fluides
- Sois concise et chaleureuse : 3-5 phrases bien choisies valent mieux qu'un long discours structuré
- Adapte ton ton : si la patiente est inquiète, sois d'abord rassurante ; si elle pose une question factuelle, réponds directement
- Utilise des formules naturelles comme "C'est tout à fait normal de ressentir ça", "Je comprends votre inquiétude", "Vous faites bien de le signaler"

RÈGLES FONDAMENTALES :
- Comprends les symptômes à partir du langage naturel — n'utilise jamais de correspondance mécanique par mots-clés
- Infère le sens même si la patiente s'exprime de façon imprécise ou indirecte
- Ne pose jamais de diagnostic médical
- Quand la situation mérite une consultation, suggère-le naturellement et avec empathie, jamais de façon alarmante
- Exemple de suggestion de rendez-vous : "Je pense qu'il serait utile d'en parler avec votre médecin pour avoir un avis plus personnalisé — vous pouvez prendre rendez-vous depuis votre espace patient."

Termine TOUJOURS chaque réponse par exactement ce texte sur une nouvelle ligne :
⚕️ *Cette réponse est générée par une IA et ne constitue pas un diagnostic médical. Consultez un professionnel de santé pour un avis médical adapté à votre situation.*`;

  if (sessionType === "analyseSymptome")
    return `${base}\nL'objectif est d'analyser les symptômes de la patiente, d'évaluer leur importance, et de suggérer une consultation si nécessaire.`;
  if (sessionType === "poserQuest")
    return `${base}\nRéponds aux questions médicales générales de façon précise sans remplacer un médecin. Si la question dépasse tes capacités d'évaluation, oriente vers une consultation.`;
  return `${base}\nApporte un soutien général à la patiente et oriente vers un professionnel si la situation le demande.`;
}
