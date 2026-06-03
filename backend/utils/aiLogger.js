const isProd = process.env.NODE_ENV === "production";

// Enregistre une étape réussie du pipeline IA dans la console sous forme de JSON structuré
function log(step, data = {}, meta = {}) {
  const entry = {
    level:     "info",
    step,
    data,
    ...meta,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(entry));
}

// Enregistre une erreur du pipeline IA avec le message et la stack trace (masquée en production)
function logError(step, error, meta = {}) {
  const entry = {
    level:     "error",
    step,
    error:     error?.message || String(error),
    stack:     isProd ? undefined : error?.stack,
    ...meta,
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(entry));
}

// Enregistre un résumé global à la fin de chaque traitement de message : sévérité, confiance, escalade, longueur de la réponse
function logPipelineSummary({ sessionId, severity, confidence, requiresEscalation, responseLength }) {
  log("pipeline_summary", {
    sessionId,
    severity,
    confidence,
    requiresEscalation,
    responseLength,
  });
}

module.exports = { log, logError, logPipelineSummary };
