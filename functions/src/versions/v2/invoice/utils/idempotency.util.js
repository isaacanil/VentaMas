const normalizeKey = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const extractFromCandidates = (candidates) => {
  for (const candidate of candidates) {
    const key = normalizeKey(candidate);
    if (key) return key;
  }
  return null;
};

const tryParseJSON = (source) => {
  if (!source) return null;
  if (typeof source === "string") {
    try {
      return JSON.parse(source);
    } catch {
      return null;
    }
  }
  if (typeof source === "object") {
    if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(source)) {
      try {
        return JSON.parse(source.toString("utf8"));
      } catch {
        return null;
      }
    }
    return source;
  }
  if (typeof source === "function") return null;
  try {
    const asString = source.toString();
    return tryParseJSON(asString);
  } catch {
    return null;
  }
};

export function resolveIdempotencyKey({ rawRequest, data } = {}) {
  const headerKey = extractFromCandidates([
    rawRequest?.headers?.["idempotency-key"],
    rawRequest?.headers?.["Idempotency-Key"],
    rawRequest?.get?.("Idempotency-Key"),
  ]);
  if (headerKey) return headerKey;

  const dataKey = extractFromCandidates([
    data?.idempotencyKey,
    data?.idempotency_key,
  ]);
  if (dataKey) return dataKey;

  let parsedBody = tryParseJSON(rawRequest?.body);
  if (!parsedBody) {
    parsedBody = tryParseJSON(rawRequest?.rawBody);
  }

  const bodyKey = extractFromCandidates([
    parsedBody?.idempotencyKey,
    parsedBody?.idempotency_key,
    parsedBody?.data?.idempotencyKey,
    parsedBody?.data?.idempotency_key,
  ]);
  if (bodyKey) return bodyKey;

  return null;
}
