export const providerStates = ['False', 'True'] as const;

export type ProviderState = (typeof providerStates)[number];

export default providerStates;
