/**
 * RAGService — Retrieval-Augmented Generation over indexed PDF chunks.
 *
 * Pipeline for indexing:
 *   chunkText → generateEmbedding (per chunk) → storeChunks → MongoDB
 *
 * Pipeline for retrieval:
 *   generateEmbedding(query) → cosineSimilarity vs all chunks → top-K results
 */

const OpenAI       = require("openai");
const MedicalChunk = require("../models/MedicalChunk");

const EMBEDDING_MODEL  = "text-embedding-3-small";
const CHUNK_SIZE       = 2000;   // target characters per chunk (~500 tokens)
const CHUNK_OVERLAP    = 300;    // character overlap between consecutive chunks
const MAX_CHUNKS       = 60;     // hard cap per document to avoid runaway API costs
const MIN_CHUNK_LEN    = 80;     // skip fragments shorter than this
const EMBED_BATCH_SIZE = 5;      // concurrent embedding requests per batch
const MIN_RAG_SCORE    = 0.32;   // minimum cosine similarity to include a chunk

let _openai = null;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY manquant");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ── Cosine similarity (pure math, no external lib) ────────────────────────────
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

// ── Text chunker ──────────────────────────────────────────────────────────────
/**
 * Splits raw text into overlapping chunks, preferring sentence boundaries.
 *
 * @param {string} text          Raw extracted text
 * @param {number} chunkSize     Target characters per chunk
 * @param {number} overlap       Overlap between consecutive chunks
 * @returns {string[]}
 */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  // Normalise whitespace while preserving paragraph breaks
  const normalised = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks = [];
  let start = 0;

  while (start < normalised.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(start + chunkSize, normalised.length);

    // Prefer to break at a sentence boundary (.  !  ?) within the last 40% of the window
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

// ── Embedding generation ──────────────────────────────────────────────────────
async function generateEmbedding(text) {
  const resp = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return resp.data[0].embedding;
}

// ── Store chunks to MongoDB ───────────────────────────────────────────────────
/**
 * Embeds all chunks in parallel batches and persists them.
 *
 * @param {string[]}    chunks
 * @param {string}      sourceFile   Original filename
 * @param {string}      sourceId     UUID identifying the document
 * @param {ObjectId}    uploadedBy   Admin user id
 * @returns {number}    Number of chunks stored
 */
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

// ── Retrieve relevant chunks ──────────────────────────────────────────────────
/**
 * Embeds the user message and returns the top-K most similar chunks.
 *
 * @param {string} userMessage
 * @param {number} topK          Maximum results (default 5)
 * @returns {Promise<Array<{ text: string, sourceFile: string, score: number }>>}
 */
async function retrieveRelevantChunks(userMessage, topK = 5) {
  const queryEmbedding = await generateEmbedding(userMessage);

  // Load only chunks that have been embedded (safeguard)
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
