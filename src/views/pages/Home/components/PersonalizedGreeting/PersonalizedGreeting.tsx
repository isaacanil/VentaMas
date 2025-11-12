import { useState } from 'react';
import { useSelector } from 'react-redux';

import { CombinedPill } from './components/CombinedPill';
import { SessionInfoModal } from './components/SessionInfoModal';

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
  const user = useSelector<RootState, UserInfo | null>((state) => (
    typeof state.user?.user === 'object' && state.user.user !== null
      ? state.user.user
      : null
  ));
  const business = useSelector<RootState, BusinessInfo | null>((state) => (
    typeof state.business?.data === 'object' && state.business.data !== null
      ? state.business.data
      : null
  ));
  const [isSessionModalOpen, setSessionModalOpen] = useState(false);

  const realName = user?.realName && typeof user.realName === 'string' ? user.realName.trim() : '';
  const username = user?.username && typeof user.username === 'string' ? user.username.trim() : '';
  const nameToDisplay = realName || username || 'Usuario';
  const logoUrl = typeof business?.logoUrl === 'string' ? business.logoUrl : null;
  const businessName =
    (typeof business?.name === 'string' && business.name) || 'Tu Negocio';

  return (
    <>
      <CombinedPill
        logoUrl={logoUrl}
        businessName={businessName}
        userName={nameToDisplay}
        onClick={() => setSessionModalOpen(true)}
      />
      <SessionInfoModal
        isOpen={isSessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        user={user}
        business={business}
      />
    </>
  );
};

export default PersonalizedGreeting;
