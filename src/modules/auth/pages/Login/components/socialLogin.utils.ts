import { isLoginDevModeEnabledHost } from '@/utils/runtime/frontendFeatureAccess';

export const resolvePublicAuthVisibility = (search: string): boolean => {
  const flag = String(import.meta.env.VITE_ENABLE_PUBLIC_AUTH || '')
    .trim()
    .toLowerCase();
  const params = new URLSearchParams(search || '');
  const devMode = params.get('dev_mode') === 'true';
  return flag === 'true' || devMode || isLoginDevModeEnabledHost();
};
