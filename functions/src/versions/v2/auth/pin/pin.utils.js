export const extractUserData = (snap) => {
  const raw = snap?.data?.() || {};
  return {
    user: raw.user || {},
    authorizationPins: raw.authorizationPins || null,
    legacyPin: raw.authorizationPin || null,
  };
};
