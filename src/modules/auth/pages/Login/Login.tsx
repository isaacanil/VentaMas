import { useState, type JSX } from 'react';

import { AuthPageShell } from '@/modules/auth/components/AuthPageShell/AuthPageShell';

import { LoginForm } from './components/LoginForm';

export const Login = (): JSX.Element => {
  const [loading, setLoading] = useState(false);

  return (
    <AuthPageShell
      imageAlt="Login visual"
      loading={loading}
      loadingTip="Iniciando sesion..."
    >
      <LoginForm setLoading={setLoading} />
    </AuthPageShell>
  );
};
