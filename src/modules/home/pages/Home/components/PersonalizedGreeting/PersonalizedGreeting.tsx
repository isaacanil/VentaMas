import { useSelector } from 'react-redux';

import { SessionInfoDropdown } from './components/SessionInfoDropdown';

import type { JSX } from 'react';

interface UserInfo {
  realName?: string | null;
  username?: string | null;
  [key: string]: unknown;
}

interface BusinessInfo {
  name?: string | null;
  logoUrl?: string | null;
  [key: string]: unknown;
}

interface RootState {
  user?: { user?: UserInfo | null };
  business?: { data?: BusinessInfo | null };
}

const PersonalizedGreeting = (): JSX.Element => {
  const user = useSelector<RootState, UserInfo | null>((state) =>
    typeof state.user?.user === 'object' && state.user.user !== null
      ? state.user.user
      : null,
  );
  const business = useSelector<RootState, BusinessInfo | null>((state) =>
    typeof state.business?.data === 'object' && state.business.data !== null
      ? state.business.data
      : null,
  );
  const realName =
    user?.realName && typeof user.realName === 'string'
      ? user.realName.trim()
      : '';
  const username =
    user?.username && typeof user.username === 'string'
      ? user.username.trim()
      : '';
  const fullName = realName || username || 'Usuario';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((name) => name[0])
    .filter((char) => /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(char))
    .join('')
    .toUpperCase();

  return (
    <SessionInfoDropdown
      userName={initials}
      fullName={fullName}
      user={user}
      business={business}
    />
  );
};

export default PersonalizedGreeting;
