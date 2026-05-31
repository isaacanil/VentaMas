export const AI_BUSINESS_SEEDING_FIRESTORE_IN_QUERY_LIMIT = 10;

const readString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

export const normalizeAvailabilityValues = (values = []) => [
  ...new Set(
    values.map((value) => readString(value).toLowerCase()).filter(Boolean),
  ),
];

export const chunkAvailabilityValues = (
  values = [],
  size = AI_BUSINESS_SEEDING_FIRESTORE_IN_QUERY_LIMIT,
) => {
  const normalizedSize = Number.isInteger(size) && size > 0 ? size : 1;
  const chunks = [];
  for (let index = 0; index < values.length; index += normalizedSize) {
    chunks.push(values.slice(index, index + normalizedSize));
  }
  return chunks;
};

export const findFirstMatchingAvailabilityValue = (items = [], matches) => {
  if (!(matches instanceof Set) || matches.size === 0) return null;

  for (let index = 0; index < items.length; index += 1) {
    const value = readString(items[index]).toLowerCase();
    if (value && matches.has(value)) {
      return { index, value };
    }
  }

  return null;
};
