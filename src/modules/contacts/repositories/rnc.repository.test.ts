import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const hoistedMaybeSingle = vi.fn();
  const hoistedEq = vi.fn(() => ({ maybeSingle: hoistedMaybeSingle }));
  const hoistedSelect = vi.fn(() => ({ eq: hoistedEq }));
  const hoistedFrom = vi.fn(() => ({ select: hoistedSelect }));
  const hoistedLookupRncRunner = vi.fn();
  const hoistedFetchAndActivate = vi.fn();
  const hoistedGetRemoteConfig = vi.fn(() => ({
    defaultConfig: {},
    settings: {},
  }));
  const hoistedGetString = vi.fn();
  const hoistedIsSupported = vi.fn();

  return {
    createClient: vi.fn(() => ({ from: hoistedFrom })),
    createFirebaseCallable: vi.fn(() => hoistedLookupRncRunner),
    eq: hoistedEq,
    fetchAndActivate: hoistedFetchAndActivate,
    from: hoistedFrom,
    getRemoteConfig: hoistedGetRemoteConfig,
    getStoredSession: vi.fn(),
    getString: hoistedGetString,
    isSupported: hoistedIsSupported,
    lookupRncRunner: hoistedLookupRncRunner,
    maybeSingle: hoistedMaybeSingle,
    select: hoistedSelect,
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  getStoredSession: mocks.getStoredSession,
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  app: {},
}));

vi.mock('@/firebase/functions/callable', () => ({
  createFirebaseCallable: mocks.createFirebaseCallable,
}));

vi.mock('firebase/remote-config', () => ({
  fetchAndActivate: mocks.fetchAndActivate,
  getRemoteConfig: mocks.getRemoteConfig,
  getString: mocks.getString,
  isSupported: mocks.isSupported,
}));

const loadRepository = async () => import('./rnc.repository');

describe('rnc.repository', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();

    mocks.createClient.mockClear();
    mocks.createFirebaseCallable.mockClear();
    mocks.eq.mockClear();
    mocks.fetchAndActivate.mockReset();
    mocks.fetchAndActivate.mockResolvedValue(true);
    mocks.from.mockClear();
    mocks.getRemoteConfig.mockClear();
    mocks.getStoredSession.mockReset();
    mocks.getStoredSession.mockReturnValue({ sessionToken: null });
    mocks.getString.mockReset();
    mocks.getString.mockReturnValue('');
    mocks.isSupported.mockReset();
    mocks.isSupported.mockResolvedValue(false);
    mocks.lookupRncRunner.mockReset();
    mocks.maybeSingle.mockReset();
    mocks.select.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses lookupRnc callable by default', async () => {
    mocks.getStoredSession.mockReturnValue({ sessionToken: 'session-token' });
    mocks.lookupRncRunner.mockResolvedValue({
      record: {
        rnc_number: '101026042',
        full_name: 'Empresa Demo',
      },
    });
    const {
      fetchRncRecordByNumber,
      isLookupRncCallableEnabled,
      resolveRncLookupSource,
    } = await loadRepository();

    expect(isLookupRncCallableEnabled()).toBe(true);
    expect(resolveRncLookupSource()).toBe('backend');

    await expect(fetchRncRecordByNumber('101026042')).resolves.toEqual({
      rnc_number: '101026042',
      full_name: 'Empresa Demo',
    });

    expect(mocks.createFirebaseCallable).toHaveBeenCalledWith('lookupRnc');
    expect(mocks.lookupRncRunner).toHaveBeenCalledWith({
      rnc: '101026042',
      sessionToken: 'session-token',
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('queries the legacy Supabase RNC table when explicitly configured', async () => {
    vi.stubEnv('VITE_RNC_LOOKUP_SOURCE', 'legacy-supabase');
    vi.stubEnv('VITE_SUPABASE_KEY', 'supabase-key');
    mocks.maybeSingle.mockResolvedValue({
      data: {
        rnc_number: '101026042',
        full_name: 'Empresa Demo',
      },
      error: null,
    });
    const {
      fetchRncRecordByNumber,
      isLookupRncCallableEnabled,
      resolveRncLookupSource,
    } = await loadRepository();

    expect(isLookupRncCallableEnabled()).toBe(false);
    expect(resolveRncLookupSource()).toBe('legacy-supabase');

    await expect(fetchRncRecordByNumber('101026042')).resolves.toEqual({
      rnc_number: '101026042',
      full_name: 'Empresa Demo',
    });

    expect(mocks.createClient).toHaveBeenCalledWith(
      'https://safxuhklxqxkcbvvgjgi.supabase.co',
      'supabase-key',
    );
    expect(mocks.from).toHaveBeenCalledWith('rnc');
    expect(mocks.select.mock.calls[0][0]).toContain('rnc_number,full_name');
    expect(mocks.select.mock.calls[0][0]).not.toBe('*');
    expect(mocks.eq).toHaveBeenCalledWith('rnc_number', '101026042');
    expect(mocks.maybeSingle).toHaveBeenCalledOnce();
    expect(mocks.createFirebaseCallable).not.toHaveBeenCalled();
  });

  it('returns null when the legacy Supabase RNC does not exist', async () => {
    vi.stubEnv('VITE_RNC_LOOKUP_SOURCE', 'legacy-supabase');
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });
    const { fetchRncRecordByNumber } = await loadRepository();

    await expect(fetchRncRecordByNumber('101026042')).resolves.toBeNull();
  });

  it('propagates Supabase errors', async () => {
    vi.stubEnv('VITE_RNC_LOOKUP_SOURCE', 'legacy-supabase');
    const supabaseError = new Error('Supabase unavailable');
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: supabaseError,
    });
    const { fetchRncRecordByNumber } = await loadRepository();

    await expect(fetchRncRecordByNumber('101026042')).rejects.toBe(
      supabaseError,
    );
  });

  it('uses lookupRnc callable when the source flag is backend', async () => {
    vi.stubEnv('VITE_RNC_LOOKUP_SOURCE', 'backend');
    mocks.lookupRncRunner.mockResolvedValue({
      data: {
        rnc_number: '101026042',
        full_name: 'Empresa Backend',
      },
    });
    const {
      fetchRncRecordByNumber,
      isLookupRncCallableEnabled,
      resolveRncLookupSource,
    } = await loadRepository();

    expect(resolveRncLookupSource()).toBe('backend');
    expect(isLookupRncCallableEnabled()).toBe(true);
    await expect(fetchRncRecordByNumber('101026042')).resolves.toEqual({
      rnc_number: '101026042',
      full_name: 'Empresa Backend',
    });

    expect(mocks.lookupRncRunner).toHaveBeenCalledWith({
      rnc: '101026042',
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('uses Remote Config as runtime override for legacy rollback', async () => {
    vi.stubEnv('VITE_RNC_LOOKUP_SOURCE', 'backend');
    vi.stubEnv('VITE_SUPABASE_KEY', 'supabase-key');
    mocks.isSupported.mockResolvedValue(true);
    mocks.getString.mockReturnValue('legacy-supabase');
    mocks.maybeSingle.mockResolvedValue({
      data: {
        rnc_number: '101026042',
        full_name: 'Empresa Legacy Runtime',
      },
      error: null,
    });
    const { fetchRncRecordByNumber, resolveRncLookupSource } =
      await loadRepository();

    expect(resolveRncLookupSource()).toBe('backend');
    await expect(fetchRncRecordByNumber('101026042')).resolves.toEqual({
      rnc_number: '101026042',
      full_name: 'Empresa Legacy Runtime',
    });

    expect(mocks.fetchAndActivate).toHaveBeenCalledOnce();
    expect(mocks.getString).toHaveBeenCalledWith(
      expect.anything(),
      'rnc_lookup_source',
    );
    expect(mocks.createClient).toHaveBeenCalledWith(
      'https://safxuhklxqxkcbvvgjgi.supabase.co',
      'supabase-key',
    );
    expect(mocks.createFirebaseCallable).not.toHaveBeenCalled();
  });

  it('ignores invalid Remote Config values and keeps env fallback', async () => {
    vi.stubEnv('VITE_RNC_LOOKUP_SOURCE', 'legacy-supabase');
    mocks.isSupported.mockResolvedValue(true);
    mocks.getString.mockReturnValue('not-a-source');
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });
    const { fetchRncRecordByNumber } = await loadRepository();

    await expect(fetchRncRecordByNumber('101026042')).resolves.toBeNull();

    expect(mocks.from).toHaveBeenCalledWith('rnc');
    expect(mocks.createFirebaseCallable).not.toHaveBeenCalled();
  });

  it('returns null from lookupRnc when the callable has no record', async () => {
    mocks.lookupRncRunner.mockResolvedValue({ record: null });
    const { fetchRncRecordByNumber } = await loadRepository();

    await expect(fetchRncRecordByNumber('101026042')).resolves.toBeNull();
  });

  it('surfaces unexpected lookupRnc responses instead of falling back silently', async () => {
    mocks.lookupRncRunner.mockResolvedValue({ record: { nested: {} } });
    const { fetchRncRecordByNumber } = await loadRepository();

    await expect(fetchRncRecordByNumber('101026042')).rejects.toThrow(
      'Respuesta invalida de lookupRnc.',
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('surfaces backend lookup failures instead of falling back silently', async () => {
    vi.stubEnv('VITE_RNC_LOOKUP_SOURCE', 'backend');
    const lookupError = new Error('snapshot missing');
    mocks.lookupRncRunner.mockRejectedValue(lookupError);
    const { fetchRncRecordByNumber } = await loadRepository();

    await expect(fetchRncRecordByNumber('101026042')).rejects.toBe(
      lookupError,
    );

    expect(mocks.lookupRncRunner).toHaveBeenCalledWith({
      rnc: '101026042',
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('returns legacy data while shadowing the backend lookup', async () => {
    vi.stubEnv('VITE_RNC_LOOKUP_SOURCE', 'shadow');
    mocks.maybeSingle.mockResolvedValue({
      data: {
        rnc_number: '101026042',
        full_name: 'Empresa Legacy',
      },
      error: null,
    });
    mocks.lookupRncRunner.mockResolvedValue({
      data: {
        rnc_number: '101026042',
        full_name: 'Empresa Legacy',
      },
    });
    const {
      fetchRncRecordByNumber,
      isLookupRncCallableEnabled,
      resolveRncLookupSource,
    } = await loadRepository();

    expect(resolveRncLookupSource()).toBe('shadow');
    expect(isLookupRncCallableEnabled()).toBe(true);
    await expect(fetchRncRecordByNumber('101026042')).resolves.toEqual({
      rnc_number: '101026042',
      full_name: 'Empresa Legacy',
    });

    expect(mocks.from).toHaveBeenCalledWith('rnc');
    expect(mocks.lookupRncRunner).toHaveBeenCalledWith({
      rnc: '101026042',
    });
  });

  it('redacts shadow backend errors before logging in development', async () => {
    vi.stubEnv('VITE_RNC_LOOKUP_SOURCE', 'shadow');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.maybeSingle.mockResolvedValue({
      data: {
        rnc_number: '101026042',
        full_name: 'Empresa Legacy',
      },
      error: null,
    });
    const sensitiveReason = {
      full_name: 'Empresa Sensible',
      rnc: '101026042',
      sessionToken: 'session-token',
    };
    mocks.lookupRncRunner.mockRejectedValue(sensitiveReason);
    const { fetchRncRecordByNumber } = await loadRepository();

    await expect(fetchRncRecordByNumber('101026042')).resolves.toEqual({
      rnc_number: '101026042',
      full_name: 'Empresa Legacy',
    });

    expect(warnSpy).toHaveBeenCalledWith('[RNC] lookupRnc shadow fallo.', {
      errorName: 'object',
    });
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.any(String),
      sensitiveReason,
    );
    warnSpy.mockRestore();
  });
});
