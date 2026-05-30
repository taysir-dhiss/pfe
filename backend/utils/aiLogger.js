const isProd = process.env.NODE_ENV === "production";

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
