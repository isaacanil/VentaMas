import type { JSX } from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { selectUser } from '../../../../../features/auth/userSlice';

import { CombinedPill } from './components/CombinedPill';
import { SessionInfoModal } from './components/SessionInfoModal';

type MaybeUser = ReturnType<typeof selectUser>;
type MaybeBusiness = ReturnType<typeof selectBusinessData>;

const PersonalizedGreeting = (): JSX.Element => {
  const user = useSelector(selectUser) as MaybeUser;
  const business = useSelector(selectBusinessData) as MaybeBusiness;
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
