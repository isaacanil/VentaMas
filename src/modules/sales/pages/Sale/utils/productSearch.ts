const MAX_DEPTH = 3;

const removeAccents = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeText = (value: string) => removeAccents(value.trim().toLowerCase());

const appendSearchTokens = (
  value: unknown,
  tokens: string[],
  visited: Set<object>,
  depth = 0,
) => {
  if (value == null || depth > MAX_DEPTH) return;

  if (typeof value === 'string') {
    const normalized = normalizeText(value);
    if (normalized) {
      tokens.push(normalized);
    }
    return;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    tokens.push(String(value));
    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  if (value instanceof Date) {
    tokens.push(normalizeText(value.toISOString()));
    return;
  }

  if (visited.has(value)) {
    return;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => appendSearchTokens(item, tokens, visited, depth + 1));
    return;
  }

  Object.values(value).forEach((item) =>
    appendSearchTokens(item, tokens, visited, depth + 1),
  );
};

export const buildProductSearchIndex = (value: unknown): string => {
  const tokens: string[] = [];
  appendSearchTokens(value, tokens, new Set<object>());
  return tokens.join(' ');
};

export const normalizeProductSearchTerm = (value: string): string =>
  normalizeText(value);
