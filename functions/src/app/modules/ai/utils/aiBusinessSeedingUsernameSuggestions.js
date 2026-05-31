const MAX_USERNAME_LENGTH = 32;

const readString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

export const normalizeAiBusinessSeedingUsernameCandidate = (
  value,
  maxLength = MAX_USERNAME_LENGTH,
) => {
  const text = readString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, maxLength)
    .replace(/[.-]+$/g, '')
    .replace(/^[.-]+/g, '')
    .replace(/^-+|-+$/g, '');

  return text;
};

const normalizeUsernameSegment = (value) =>
  normalizeAiBusinessSeedingUsernameCandidate(value, 20);

const uniqueNonEmpty = (values) => [...new Set(values.filter(Boolean))];

export const buildAiBusinessSeedingUsernameSuggestions = ({
  username,
  businessName,
  realName,
}) => {
  const baseUser = normalizeUsernameSegment(username) || 'usuario';
  const businessSlug =
    normalizeAiBusinessSeedingUsernameCandidate(businessName);
  const realNameSlug = normalizeUsernameSegment(realName);
  const ownerSlug = realNameSlug || 'owner';
  const shortBusinessSlug = businessSlug
    .replace(/\b(duplicado|staging|test|prueba)\b/g, '')
    .replace(/-\d{3,}(?:-[a-z])?$/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  const rawCandidates = [
    `${baseUser}-1`,
    `${baseUser}-2`,
    shortBusinessSlug ? `${shortBusinessSlug}-${ownerSlug}` : '',
    shortBusinessSlug ? `${ownerSlug}-${shortBusinessSlug}` : '',
    shortBusinessSlug ? `${shortBusinessSlug}-admin` : '',
    realNameSlug ? `${realNameSlug}-1` : '',
  ];

  const candidates = uniqueNonEmpty(
    rawCandidates.map((candidate) =>
      normalizeAiBusinessSeedingUsernameCandidate(candidate),
    ),
  ).filter((candidate) => candidate && candidate !== baseUser);

  return candidates.slice(0, 5);
};
