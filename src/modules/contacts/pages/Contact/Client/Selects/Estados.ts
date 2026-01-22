export const estados = ['False', 'True'] as const;

export type Estado = (typeof estados)[number];

export default estados;
