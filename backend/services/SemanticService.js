const OpenAI         = require("openai");
const Recommendation = require("../models/Recommendation");

const EMBEDDING_MODEL  = "text-embedding-3-small";
const THRESHOLD_HIGH   = 0.82;
const THRESHOLD_MEDIUM = 0.62;
const TOP_K            = 3;

// Crée le client OpenAI une seule fois et le réutilise pour tous les appels suivants
let _openai = null;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY manquant");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Mesure à quel point deux vecteurs se ressemblent : résultat proche de 1 = très similaires, proche de 0 = rien en commun
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Envoie un texte à OpenAI et récupère son vecteur numérique de 1536 dimensions
async function generateEmbedding(text) {
  const resp = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return resp.data[0].embedding;
}

// Compare le message actuel de la patiente avec ses recommandations passées et retourne la plus proche si elle est suffisamment similaire
async function findSemanticContext(userMessage, patientId) {
  const queryEmbedding = await generateEmbedding(userMessage);

  const recs = await Recommendation.find({
    patientId,
    "embedding.0": { $exists: true },
  })
    .select("contenu niveauPriorite embedding")
    .limit(100)
    .lean();

  if (!recs.length) {
    return { tier: "none", context: null, score: 0 };
  }

  const scored = recs
    .map((r) => ({
      contenu:       r.contenu,
      niveauPriorite: r.niveauPriorite,
      score:         cosineSimilarity(queryEmbedding, r.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  const topScore = scored[0].score;
  console.log(`[Semantic] top score: ${topScore.toFixed(4)} over ${recs.length} recommendations`);

  if (topScore >= THRESHOLD_HIGH) {
    return {
      tier:    "high",
      context: scored[0].contenu.slice(0, 1000),
      score:   topScore,
    };
  }

  if (topScore >= THRESHOLD_MEDIUM) {
    const combined = scored
      .slice(0, 2)
      .map((r) => r.contenu.slice(0, 500))
      .join("\n---\n");
    return {
      tier:    "medium",
      context: combined,
      score:   topScore,
    };
  }

  return { tier: "low", context: null, score: topScore };
}

module.exports = { generateEmbedding, cosineSimilarity, findSemanticContext };
