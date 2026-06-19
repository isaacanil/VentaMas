export type RncLookupSource = 'legacy-supabase' | 'backend' | 'shadow';

export const normalizeRncLookupSource = (
  value: unknown,
): RncLookupSource | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();

  if (normalized === 'backend' || normalized === 'firebase') return 'backend';
  if (normalized === 'shadow') return 'shadow';
  if (normalized === 'legacy' || normalized === 'legacy-supabase') {
    return 'legacy-supabase';
  }

  return null;
};

export const resolveRncLookupSourceValue = ({
  envValue,
  remoteValue,
}: {
  envValue?: unknown;
  remoteValue?: unknown;
} = {}): RncLookupSource =>
  normalizeRncLookupSource(remoteValue) ??
  normalizeRncLookupSource(envValue) ??
  'backend';
