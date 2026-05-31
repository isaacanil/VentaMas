import { authenticateWithGoogleProvider } from '@/modules/auth/repositories/providerLogin.repository';
import {
  buildGoogleProviderLoginSuccess,
  type GoogleProviderLoginResult,
} from '@/modules/auth/utils/providerLogin';

export type { GoogleProviderLoginResult };

export const runGoogleProviderLogin =
  async (): Promise<GoogleProviderLoginResult> => {
    try {
      const payload = await authenticateWithGoogleProvider();
      return buildGoogleProviderLoginSuccess(payload);
    } catch (error: unknown) {
      return {
        errorMessage:
          error instanceof Error && error.message
            ? error.message
            : 'No se pudo iniciar sesion con Google.',
        status: 'error',
      };
    }
  };
