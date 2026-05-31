import { useState, type JSX } from 'react';

import { AuthPageShell } from '@/modules/auth/components/AuthPageShell/AuthPageShell';

import { SignUpAccountForm } from './components/SignUpAccountForm';

export const SignUp = (): JSX.Element => {
  const [loading, setLoading] = useState(false);

  return (
    <AuthPageShell
      imageAlt="Registro visual"
      loading={loading}
      loadingTip="Creando cuenta..."
    >
      <SignUpAccountForm setLoading={setLoading} />
    </AuthPageShell>
  );
};

export default SignUp;
