const parseBooleanEnv = (rawValue, fallbackValue) => {
  if (typeof rawValue !== 'string') return fallbackValue;
  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) return fallbackValue;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallbackValue;
};

export const resolveMembershipWritePolicy = () => {
  const writeCanonical = parseBooleanEnv(
    process.env.MULTIBUSINESS_DUAL_WRITE_CANONICAL,
    true,
  );
  const writeLegacy = parseBooleanEnv(
    process.env.MULTIBUSINESS_DUAL_WRITE_LEGACY,
    true,
  );

  return {
    writeCanonical,
    writeLegacy,
  };
};

export const assertMembershipWritePolicy = (policy) => {
  const resolvedPolicy = policy || resolveMembershipWritePolicy();
  if (!resolvedPolicy.writeCanonical && !resolvedPolicy.writeLegacy) {
    throw new Error(
      'Configuración inválida: MULTIBUSINESS_DUAL_WRITE_CANONICAL y MULTIBUSINESS_DUAL_WRITE_LEGACY no pueden estar ambos en false.',
    );
  }
  return resolvedPolicy;
};
