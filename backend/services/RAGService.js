const OpenAI       = require("openai");
const MedicalChunk = require("../models/MedicalChunk");

const EMBEDDING_MODEL  = "text-embedding-3-small";
const CHUNK_SIZE       = 2000;
const CHUNK_OVERLAP    = 300;
const MAX_CHUNKS       = 60;
const MIN_CHUNK_LEN    = 80;
const EMBED_BATCH_SIZE = 5;
const MIN_RAG_SCORE    = 0.32;

let _openai = null;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY manquant");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

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

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const normalised = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks = [];
  let start = 0;

  while (start < normalised.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(start + chunkSize, normalised.length);

    if (end < normalised.length) {
      const searchFrom = start + Math.floor(chunkSize * 0.6);
      let best = -1;
      for (const ch of [".", "!", "?"]) {
        const idx = normalised.lastIndexOf(ch, end);
        if (idx > searchFrom && idx > best) best = idx;
      }
      if (best !== -1) end = best + 1;
    }

    const chunk = normalised.slice(start, end).trim();
    if (chunk.length >= MIN_CHUNK_LEN) chunks.push(chunk);

    start = end - overlap;
    if (start <= 0 || start >= normalised.length) break;
  }

  return chunks;
}

async function generateEmbedding(text) {
  const resp = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return resp.data[0].embedding;
}

async function storeChunks(chunks, sourceFile, sourceId, uploadedBy) {
  const docs = [];

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);

    const embedded = await Promise.all(
      batch.map(async (text, j) => {
        const embedding = await generateEmbedding(text);
        return {
          sourceFile,
          sourceId,
          chunkIndex: i + j,
          text,
          embedding,
          charCount: text.length,
          uploadedBy,
        };
      })
    );

    docs.push(...embedded);
  }

  await MedicalChunk.insertMany(docs);
  return docs.length;
}

async function retrieveRelevantChunks(userMessage, topK = 5) {
  const queryEmbedding = await generateEmbedding(userMessage);

  const candidates = await MedicalChunk.find({ "embedding.0": { $exists: true } })
    .select("text sourceFile chunkIndex embedding")
    .limit(1000)
    .lean();

  if (!candidates.length) return [];

  const scored = candidates
    .map((c) => ({
      text:       c.text,
      sourceFile: c.sourceFile,
      chunkIndex: c.chunkIndex,
      score:      cosineSimilarity(queryEmbedding, c.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((c) => c.score >= MIN_RAG_SCORE);

  return scored;
}

module.exports = { chunkText, generateEmbedding, storeChunks, retrieveRelevantChunks };
