import { createClient } from '@supabase/supabase-js';

import { app } from '@/firebase/firebaseconfig';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import {
  normalizeRncLookupSource,
  resolveRncLookupSourceValue,
  type RncLookupSource,
} from './rncLookupSource';

const RNC_SUPABASE_URL = 'https://safxuhklxqxkcbvvgjgi.supabase.co';
const RNC_LOOKUP_SOURCE_ENV = 'VITE_RNC_LOOKUP_SOURCE';
const RNC_LOOKUP_SOURCE_REMOTE_KEY =
  import.meta.env.VITE_RNC_LOOKUP_SOURCE_REMOTE_KEY || 'rnc_lookup_source';
const RNC_LOOKUP_REMOTE_CONFIG_ENABLED =
  import.meta.env.VITE_RNC_LOOKUP_REMOTE_CONFIG !== 'false';
const RNC_LOOKUP_REMOTE_CONFIG_MIN_FETCH_MS = 5 * 60 * 1000;
const RNC_SELECT_COLUMNS = [
  'rnc_number',
  'full_name',
  'business_name',
  'business_activity',
  'category',
  'payment_regime',
  'field_6',
  'field_7',
  'registration_date',
  'status',
  'condition',
  'raw_fields_json',
  'source_updated_at',
].join(',');

export type DgiiComparableValue = string | number | null | undefined;
export type DgiiRecord = Record<string, DgiiComparableValue>;

type LookupRncPayload = {
  rnc: string;
  sessionToken?: string;
};

type LookupRncCallable = (payload: LookupRncPayload) => Promise<unknown>;

let lookupRncCallable: LookupRncCallable | null = null;
let rncSupabase: ReturnType<typeof createClient> | null = null;
let remoteLookupSourcePromise: Promise<RncLookupSource | null> | null = null;

const readEnvValue = (key: string): string | undefined => {
  const env = import.meta.env as Record<string, string | undefined>;
  return env[key];
};

export const resolveRncLookupSource = (): RncLookupSource => {
  return resolveRncLookupSourceValue({
    envValue: readEnvValue(RNC_LOOKUP_SOURCE_ENV),
  });
};

export const isLookupRncCallableEnabled = (): boolean => {
  const source = resolveRncLookupSource();
  return source === 'backend' || source === 'shadow';
};

const fetchRemoteRncLookupSource = async (): Promise<RncLookupSource | null> => {
  if (!RNC_LOOKUP_REMOTE_CONFIG_ENABLED) return null;

  try {
    const { fetchAndActivate, getRemoteConfig, getString, isSupported } =
      await import('firebase/remote-config');

    if (!(await isSupported())) return null;

    const remoteConfig = getRemoteConfig(app);
    remoteConfig.defaultConfig = {
      [RNC_LOOKUP_SOURCE_REMOTE_KEY]: resolveRncLookupSource(),
    };
    remoteConfig.settings.minimumFetchIntervalMillis =
      RNC_LOOKUP_REMOTE_CONFIG_MIN_FETCH_MS;
    remoteConfig.settings.fetchTimeoutMillis = 5000;

    await fetchAndActivate(remoteConfig);

    return normalizeRncLookupSource(
      getString(remoteConfig, RNC_LOOKUP_SOURCE_REMOTE_KEY),
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[RNC] Remote Config no disponible.', error);
    }
    return null;
  }
};

const resolveRncLookupSourceAsync = async (): Promise<RncLookupSource> => {
  if (!remoteLookupSourcePromise) {
    remoteLookupSourcePromise = fetchRemoteRncLookupSource();
  }

  const remoteSource = await remoteLookupSourcePromise;
  return resolveRncLookupSourceValue({
    envValue: readEnvValue(RNC_LOOKUP_SOURCE_ENV),
    remoteValue: remoteSource,
  });
};

const getLookupRncCallable = (): LookupRncCallable => {
  if (!lookupRncCallable) {
    lookupRncCallable = createFirebaseCallable<LookupRncPayload, unknown>(
      'lookupRnc',
    );
  }

  return lookupRncCallable;
};

const getRncSupabase = () => {
  if (!rncSupabase) {
    rncSupabase = createClient(
      RNC_SUPABASE_URL,
      readEnvValue('VITE_SUPABASE_KEY') ?? '',
    );
  }

  return rncSupabase;
};

const isComparableValue = (value: unknown): value is DgiiComparableValue =>
  value == null || typeof value === 'string' || typeof value === 'number';

const isDgiiRecord = (value: unknown): value is DgiiRecord =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.values(value).every(isComparableValue);

const normalizeLookupRncResponse = (response: unknown): DgiiRecord | null => {
  if (response == null) return null;

  if (
    response !== null &&
    typeof response === 'object' &&
    !Array.isArray(response) &&
    'ok' in response &&
    (response as { ok?: unknown }).ok === false
  ) {
    throw new Error('lookupRnc backend no disponible.');
  }

  if (
    response !== null &&
    typeof response === 'object' &&
    !Array.isArray(response) &&
    'record' in response
  ) {
    const record = (response as { record?: unknown }).record;
    if (record == null) return null;
    if (isDgiiRecord(record)) return record;
  }

  if (
    response !== null &&
    typeof response === 'object' &&
    !Array.isArray(response) &&
    'data' in response
  ) {
    const record = (response as { data?: unknown }).data;
    if (record == null) return null;
    if (isDgiiRecord(record)) return record;
  }

  if (isDgiiRecord(response)) return response;

  throw new Error('Respuesta invalida de lookupRnc.');
};

const fetchRncRecordFromLookupCallable = async (
  value: string,
): Promise<DgiiRecord | null> => {
  const { sessionToken } = getStoredSession();
  const response = await getLookupRncCallable()({
    rnc: value,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return normalizeLookupRncResponse(response);
};

const fetchRncRecordFromLegacySupabase = async (
  value: string,
): Promise<DgiiRecord | null> => {
  const { data, error } = await getRncSupabase()
    .from('rnc')
    .select(RNC_SELECT_COLUMNS)
    .eq('rnc_number', value)
    .maybeSingle<DgiiRecord>();

  if (error) {
    throw error;
  }

  return data;
};

const normalizeComparableRecord = (record: DgiiRecord | null) => {
  if (!record) return null;

  return Object.keys(record)
    .sort()
    .reduce<Record<string, DgiiComparableValue>>((acc, key) => {
      acc[key] = record[key];
      return acc;
    }, {});
};

const recordsAreEquivalent = (
  left: DgiiRecord | null,
  right: DgiiRecord | null,
) =>
  JSON.stringify(normalizeComparableRecord(left)) ===
  JSON.stringify(normalizeComparableRecord(right));

const reportShadowDifference = (
  legacyData: DgiiRecord | null,
  backendData: DgiiRecord | null,
) => {
  if (!import.meta.env.DEV || recordsAreEquivalent(legacyData, backendData)) {
    return;
  }

  console.warn('[RNC] Diferencia entre Supabase y lookupRnc', {
    backendFound: Boolean(backendData),
    backendKeys: backendData ? Object.keys(backendData).sort() : [],
    legacyFound: Boolean(legacyData),
    legacyKeys: legacyData ? Object.keys(legacyData).sort() : [],
  });
};

export const fetchRncRecordByNumber = async (
  value: string,
): Promise<DgiiRecord | null> => {
  const source = await resolveRncLookupSourceAsync();

  if (source === 'backend') {
    return fetchRncRecordFromLookupCallable(value);
  }

  if (source === 'shadow') {
    const [legacyResult, backendResult] = await Promise.allSettled([
      fetchRncRecordFromLegacySupabase(value),
      fetchRncRecordFromLookupCallable(value),
    ]);

    if (backendResult.status === 'rejected' && import.meta.env.DEV) {
      console.warn('[RNC] lookupRnc shadow fallo.', {
        errorName:
          backendResult.reason instanceof Error
            ? backendResult.reason.name
            : typeof backendResult.reason,
      });
    }

    if (legacyResult.status === 'rejected') {
      throw legacyResult.reason;
    }

    const legacyData = legacyResult.value;
    const backendData =
      backendResult.status === 'fulfilled' ? backendResult.value : null;
    reportShadowDifference(legacyData, backendData);

    return legacyData;
  }

  return fetchRncRecordFromLegacySupabase(value);
};
