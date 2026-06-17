import {
  normalizeAiBusinessSeedingUsernameCandidate,
} from './aiBusinessSeedingUsernameSuggestions.js';
import {
  normalizeAiBusinessSeedingText as normalizeText,
  readAiBusinessSeedingString as readString,
} from './aiBusinessSeedingText.util.js';

const BUSINESS_SECTION_HEADING = 'datos del negocio';
const USERS_SECTION_HEADING = 'usuarios';

const ROLE_ALIASES = new Map([
  ['admin', 'admin'],
  ['administrador', 'admin'],
  ['administradora', 'admin'],
  ['owner', 'owner'],
  ['dueno', 'owner'],
  ['duena', 'owner'],
  ['propietario', 'owner'],
  ['propietaria', 'owner'],
  ['manager', 'manager'],
  ['gerente', 'manager'],
  ['cashier', 'cashier'],
  ['cajero', 'cashier'],
  ['cajera', 'cashier'],
  ['caja', 'cashier'],
  ['buyer', 'buyer'],
  ['comprador', 'buyer'],
  ['compradora', 'buyer'],
]);

const normalizeLabel = (value) =>
  normalizeText(value)
    .replace(/^[-*]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeHeading = (value) => normalizeLabel(value).replace(/:+$/g, '');

const parseLineLabel = (line) => {
  const text = readString(line);
  const separatorIndex = text.indexOf(':');
  if (separatorIndex < 0) return null;

  return {
    label: normalizeLabel(text.slice(0, separatorIndex)),
    value: readString(text.slice(separatorIndex + 1)),
  };
};

const hasSlashSeparatedPeople = (value) => {
  const parts = readString(value)
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 1 && parts.every((part) => /[a-zA-Z]/.test(part));
};

const cleanLines = (prompt) =>
  readString(prompt)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const findHeadingIndex = (lines, heading) =>
  lines.findIndex((line) => normalizeHeading(line) === heading);

const getSectionLines = ({ lines, startHeading, endHeading }) => {
  const startIndex = findHeadingIndex(lines, startHeading);
  if (startIndex < 0) return [];
  const endIndex = endHeading
    ? findHeadingIndex(lines.slice(startIndex + 1), endHeading)
    : -1;
  const absoluteEndIndex =
    endIndex >= 0 ? startIndex + 1 + endIndex : lines.length;
  return lines.slice(startIndex + 1, absoluteEndIndex);
};

const readLabelValue = (lines, labels) => {
  const accepted = new Set(labels.map(normalizeLabel));
  for (const line of lines) {
    const parsed = parseLineLabel(line);
    if (parsed && accepted.has(parsed.label) && parsed.value) {
      return parsed.value;
    }
  }
  return '';
};

const findLabelLineIndex = (lines, labels) => {
  const accepted = new Set(labels.map(normalizeLabel));
  return lines.findIndex((line) => {
    const parsed = parseLineLabel(line);
    return parsed ? accepted.has(parsed.label) : false;
  });
};

const resolveRole = (value) => ROLE_ALIASES.get(normalizeText(value)) || '';

const resolveRoleLabel = (value) => {
  const directRole = resolveRole(value);
  if (directRole) return directRole;

  const parts = normalizeText(value)
    .split(/[/,|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  for (const part of parts) {
    const role = resolveRole(part);
    if (role) return role;
  }
  return '';
};

const isUserBlockStart = (line) => {
  const parsed = parseLineLabel(line);
  return parsed ? Boolean(resolveRoleLabel(parsed.label)) : false;
};

const getBlockUntilNextHeading = (lines, startIndex) => {
  if (startIndex < 0) return [];

  const rest = lines.slice(startIndex);
  const nextHeadingOffset = rest
    .slice(1)
    .findIndex((line) => isUserBlockStart(line));

  if (nextHeadingOffset < 0) return rest;
  return rest.slice(0, nextHeadingOffset + 1);
};

const mapRole = (value, fallback = 'admin') =>
  resolveRole(value) || fallback;

const buildUsername = (...values) => {
  for (const value of values) {
    const candidate = normalizeAiBusinessSeedingUsernameCandidate(value);
    if (candidate) return candidate;
  }
  return '';
};

const normalizeBusinessType = (value) => {
  const normalized = normalizeText(value);
  if (normalized.includes('farmacia') || normalized.includes('pharmacy')) {
    return 'pharmacy';
  }
  return 'general';
};

const buildBusinessFromLines = (businessLines) => {
  const name = readLabelValue(businessLines, ['nombre']);
  if (!name) return null;

  return {
    name,
    rnc: readLabelValue(businessLines, ['rnc']) || undefined,
    address: readLabelValue(businessLines, ['direccion', 'address']) || undefined,
    tel:
      readLabelValue(businessLines, ['telefono', 'tel', 'phone']) || undefined,
    email: readLabelValue(businessLines, ['email', 'correo']) || undefined,
    businessType: normalizeBusinessType(
      readLabelValue(businessLines, ['tipo', 'tipo de negocio']),
    ),
  };
};

const getUserBlocks = (usersLines) => {
  const blocks = [];
  let currentBlock = [];

  for (const line of usersLines) {
    if (isUserBlockStart(line)) {
      if (currentBlock.length) blocks.push(currentBlock);
      currentBlock = [line];
      continue;
    }

    if (currentBlock.length) currentBlock.push(line);
  }

  if (currentBlock.length) blocks.push(currentBlock);
  return blocks;
};

const buildUserFromBlock = (block) => {
  const heading = parseLineLabel(block[0]);
  const headingRole = resolveRoleLabel(heading?.label);
  const role = headingRole || resolveRole(readLabelValue(block, ['rol', 'role']));
  const realName =
    readString(heading?.value) ||
    readLabelValue(block, ['nombre completo', 'nombre', 'realname']);
  const username = buildUsername(
    readLabelValue(block, ['nombre de usuario', 'usuario', 'username']),
    realName,
    role === 'cashier' ? 'caja' : role,
  );
  const email = readLabelValue(block, ['email', 'correo']);

  if (!role || !username) return null;

  return {
    realName: realName || undefined,
    name: username,
    role,
    password:
      readLabelValue(block, ['contrasena', 'password', 'clave']) || undefined,
    ...(email ? { email } : {}),
  };
};

const buildUsersFromBlocks = (usersLines) =>
  getUserBlocks(usersLines).map(buildUserFromBlock).filter(Boolean);

const buildOwnerUser = (usersLines) => {
  const ownerIndex = findLabelLineIndex(usersLines, [
    'dueno',
    'duena',
    'owner',
    'propietario',
    'propietaria',
  ]);
  const ownerBlock = getBlockUntilNextHeading(usersLines, ownerIndex);
  const ownerLabel = ownerIndex >= 0 ? parseLineLabel(usersLines[ownerIndex]) : null;
  const fullName =
    readString(ownerLabel?.value) ||
    readLabelValue(ownerBlock, ['nombre completo', 'nombre']) ||
    readLabelValue(usersLines, ['nombre completo']);

  if (!fullName) return null;

  const username = buildUsername(
    readLabelValue(ownerBlock, ['nombre de usuario', 'usuario', 'username']),
    fullName,
  );
  if (!username) return null;

  return {
    realName: fullName,
    name: username,
    role: 'owner',
    password:
      readLabelValue(ownerBlock, ['contrasena', 'password', 'clave']) ||
      undefined,
  };
};

const buildCashierUser = (usersLines) => {
  const cashierIndex = findLabelLineIndex(usersLines, ['caja', 'cashier']);
  if (cashierIndex < 0) return null;

  const cashierBlock = getBlockUntilNextHeading(usersLines, cashierIndex);
  const displayName =
    readLabelValue(cashierBlock, ['nombre completo', 'nombre']) ||
    readLabelValue(cashierBlock, ['nombre de usuario', 'usuario', 'username']);
  const username = buildUsername(
    readLabelValue(cashierBlock, ['nombre de usuario', 'usuario', 'username']),
    displayName,
    'caja',
  );
  if (!username) return null;

  return {
    realName: displayName || undefined,
    name: username,
    role: mapRole(readLabelValue(cashierBlock, ['rol', 'role']), 'cashier'),
    password:
      readLabelValue(cashierBlock, ['contrasena', 'password', 'clave']) ||
      undefined,
  };
};

const uniqueUsersByName = (users) => {
  const seen = new Set();
  const output = [];
  for (const user of users) {
    if (!user?.name || seen.has(user.name)) continue;
    seen.add(user.name);
    output.push(user);
  }
  return output;
};

const collectUserAmbiguities = (usersLines) => {
  const ambiguities = [];
  for (const block of getUserBlocks(usersLines)) {
    const heading = parseLineLabel(block[0]);
    const headingRole = resolveRoleLabel(heading?.label);
    const explicitRole = readLabelValue(block, ['rol', 'role']);
    const resolvedExplicitRole = resolveRole(explicitRole);
    const nameCandidates = [
      readString(heading?.value),
      readLabelValue(block, ['nombre completo']),
      readLabelValue(block, ['nombre']),
      readLabelValue(block, ['nombre de usuario', 'usuario', 'username']),
    ].filter(Boolean);

    if (
      headingRole === 'owner' &&
      explicitRole &&
      resolvedExplicitRole &&
      resolvedExplicitRole !== 'owner'
    ) {
      ambiguities.push(
        'El bloque dice Dueno/Owner, pero el rol escrito ahi no es owner.',
      );
    }

    if (
      headingRole === 'owner' &&
      nameCandidates.some(hasSlashSeparatedPeople)
    ) {
      ambiguities.push(
        'El nombre del dueno contiene varias personas separadas por "/".',
      );
    }

    if (
      headingRole === 'cashier' &&
      nameCandidates.some(hasSlashSeparatedPeople)
    ) {
      ambiguities.push(
        'El nombre de Caja contiene varias personas separadas por "/".',
      );
    }
  }

  return ambiguities;
};

const buildAmbiguityQuestion = (ambiguities) => {
  const summary = ambiguities.slice(0, 3).join(' ');
  return `${summary} Confirmame si esos nombres separados por "/" son usuarios distintos o un usuario compartido, y quien debe quedar como owner.`;
};

export const buildAiBusinessSeedingFormDraft = (prompt) => {
  const lines = cleanLines(prompt);
  if (lines.length === 0) return null;

  const businessLines = getSectionLines({
    lines,
    startHeading: BUSINESS_SECTION_HEADING,
    endHeading: USERS_SECTION_HEADING,
  });
  const usersLines = getSectionLines({
    lines,
    startHeading: USERS_SECTION_HEADING,
  });

  if (businessLines.length === 0 || usersLines.length === 0) return null;

  const business = buildBusinessFromLines(businessLines);
  if (!business) return null;

  const usersFromBlocks = buildUsersFromBlocks(usersLines);
  const users = uniqueUsersByName(
    usersFromBlocks.length
      ? usersFromBlocks
      : [buildOwnerUser(usersLines), buildCashierUser(usersLines)],
  );
  const ambiguities = collectUserAmbiguities(usersLines);

  if (!users.length) {
    return {
      action: 'chat',
      data: {
        message:
          'Necesito que me indiques al menos un usuario para completar el registro.',
        business,
      },
    };
  }

  if (ambiguities.length > 0) {
    return {
      action: 'chat',
      data: {
        message: buildAmbiguityQuestion(ambiguities),
        business,
        users,
        ambiguities,
      },
    };
  }

  const ownerCount = users.filter((user) => user.role === 'owner').length;
  if (ownerCount !== 1) {
    return {
      action: 'chat',
      data: {
        message:
          'Necesito confirmar quien sera el owner del negocio antes de continuar.',
        business,
        users,
      },
    };
  }

  return {
    action: 'create_business',
    data: {
      business,
      users,
    },
  };
};
