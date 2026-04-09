import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getStoredSessionMock = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  currentUser: null as null | { getIdToken: () => Promise<string | null> },
}));

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  getStoredSession: (...args: unknown[]) => getStoredSessionMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  auth: authState,
}));

const loadFunctionsApiClient = async () => import('./functionsApiClient');

describe('functionsApiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    getStoredSessionMock.mockReset();
    getStoredSessionMock.mockReturnValue({
      sessionToken: null,
      sessionExpiresAt: null,
      sessionId: null,
      deviceId: null,
    });
    authState.currentUser = null;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('usa la URL custom de functions recortando la barra final', async () => {
    vi.stubEnv(
      'VITE_FIREBASE_FUNCTIONS_BASE_URL',
      'https://example.com/functions/',
    );

    const { getFunctionsBaseUrl } = await loadFunctionsApiClient();

    expect(getFunctionsBaseUrl()).toBe('https://example.com/functions');
  });

  it('deriva la URL desde region y project id cuando no hay base URL custom', async () => {
    vi.stubEnv('VITE_FIREBASE_REGION', 'northamerica-northeast1');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'ventamas-test');

    const { getFunctionsBaseUrl } = await loadFunctionsApiClient();

    expect(getFunctionsBaseUrl()).toBe(
      'https://northamerica-northeast1-ventamas-test.cloudfunctions.net',
    );
  });

  it('lanza un error cuando no puede resolver la URL base', async () => {
    vi.stubEnv('VITE_FIREBASE_FUNCTIONS_BASE_URL', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');

    const { getFunctionsBaseUrl } = await loadFunctionsApiClient();

    expect(() => getFunctionsBaseUrl()).toThrow(
      'No se pudo determinar la URL de Cloud Functions. Verifica la configuración.',
    );
  });

  it('construye headers con id token y session token cuando ambos existen', async () => {
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'ventamas-test');
    authState.currentUser = {
      getIdToken: vi.fn().mockResolvedValue('id-token-1'),
    };
    getStoredSessionMock.mockReturnValue({
      sessionToken: 'session-1',
      sessionExpiresAt: null,
      sessionId: 'sid-1',
      deviceId: 'device-1',
    });

    const { buildFunctionsAuthHeaders } = await loadFunctionsApiClient();

    await expect(buildFunctionsAuthHeaders()).resolves.toEqual({
      Authorization: 'Bearer id-token-1',
      'X-Session-Token': 'session-1',
    });
  });

  it('cae a session token cuando obtener el id token falla', async () => {
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'ventamas-test');
    authState.currentUser = {
      getIdToken: vi.fn().mockRejectedValue(new Error('token error')),
    };
    getStoredSessionMock.mockReturnValue({
      sessionToken: 'session-only',
      sessionExpiresAt: null,
      sessionId: 'sid-2',
      deviceId: 'device-2',
    });

    const { buildFunctionsAuthHeaders } = await loadFunctionsApiClient();

    await expect(buildFunctionsAuthHeaders()).resolves.toEqual({
      'X-Session-Token': 'session-only',
    });
  });

  it('lanza un error cuando no hay ninguna credencial disponible', async () => {
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'ventamas-test');

    const { buildFunctionsAuthHeaders } = await loadFunctionsApiClient();

    await expect(buildFunctionsAuthHeaders()).rejects.toThrow(
      'Debes iniciar sesión para continuar.',
    );
  });

  it('parsea respuestas exitosas y enriquece errores HTTP con status y code', async () => {
    const { parseFunctionsResponse } = await loadFunctionsApiClient();

    await expect(
      parseFunctionsResponse<{ ok: boolean }>(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ).resolves.toEqual({ ok: true });

    await expect(
      parseFunctionsResponse(
        new Response(
          JSON.stringify({
            error: 'Permiso denegado',
            code: 'permission-denied',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    ).rejects.toMatchObject({
      message: 'Permiso denegado',
      status: 403,
      code: 'permission-denied',
    });
  });
});
