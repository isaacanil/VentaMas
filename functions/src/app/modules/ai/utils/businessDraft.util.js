const safeString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

const asArrayOfStrings = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => safeString(item))
        .filter(Boolean)
        .slice(0, 12)
    : [];

export const buildSuggestedBusinessDraft = ({ input, aiDraft }) => {
  const chosenName =
    safeString(input.name) ||
    safeString(aiDraft?.formSuggestions?.name) ||
    safeString(input.idea) ||
    'Nuevo Negocio';
  const rawBusinessType =
    safeString(input.businessType) ||
    safeString(aiDraft?.formSuggestions?.businessType) ||
    'general';
  const businessType = rawBusinessType === 'pharmacy' ? 'pharmacy' : 'general';

  return {
    businessType,
    name: chosenName,
    rnc: safeString(input.rnc),
    email: safeString(input.email),
    tel: safeString(input.tel),
    country:
      safeString(input.country) || safeString(aiDraft?.formSuggestions?.country),
    province:
      safeString(input.province) || safeString(aiDraft?.formSuggestions?.province),
    address: safeString(input.address),
    logo: '',
    aiMetadata: {
      source: 'aiCreateBusinessAgent',
      modelSummaryAvailable: Boolean(safeString(aiDraft?.guidance?.summary)),
      summary: safeString(aiDraft?.guidance?.summary),
      checklist: asArrayOfStrings(aiDraft?.guidance?.launchChecklist),
      riskWarnings: asArrayOfStrings(aiDraft?.guidance?.riskWarnings),
    },
  };
};
