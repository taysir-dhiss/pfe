/**
 * aiLogger — structured JSON logger for the AI pipeline.
 * Every step of classification → reasoning → safety → response is recorded.
 * In production, replace console.log/error with your log transport (Winston, Datadog, etc.).
 */

const isProd = process.env.NODE_ENV === "production";

/**
 * Log a successful pipeline step.
 * @param {string} step   e.g. "classification", "medical_reasoning", "safety_filter"
 * @param {object} data   Step-specific payload
 * @param {object} meta   Optional extra fields (sessionId, userId …)
 */
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

/**
 * Log a pipeline error (uses stderr so it can be filtered separately).
 * @param {string} step
 * @param {Error}  error
 * @param {object} meta
 */
function logError(step, error, meta = {}) {
  const entry = {
    level:     "error",
    step,
    error:     error?.message || String(error),
    // Omit stack in production to avoid leaking internals
    stack:     isProd ? undefined : error?.stack,
    ...meta,
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(entry));
}

/**
 * Convenience: log the complete pipeline summary at the end of sendMessage.
 */
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
