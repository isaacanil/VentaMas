import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../features/auth/userSlice';
import { userAccess } from '../../../../../hooks/abilities/useAbilities';
import { getDeveloperFeaturesData, getMenuCardData } from '../../CardData';
import { FeatureCardList } from '../FeatureCardList/FeatureCardList';

import type { FeatureCardData } from '../FeatureCardList/FeatureCard';
import type { JSX } from 'react';

type MaybeUser = ReturnType<typeof selectUser>;

export const DashboardShortcuts = (): JSX.Element => {
  const user = useSelector(selectUser);
  const cardData = (getMenuCardData(user) ?? []) as FeatureCardData[];
  const developer = (getDeveloperFeaturesData(user) ?? []) as FeatureCardData[];
  const { abilities } = userAccess();

  return (
    <ShortcutsSection>
      {abilities?.can('developerAccess', 'all') && (
        <FeatureCardList title="Funciones de desarrollador" cardData={developer} />
      )}
      <FeatureCardList title="Atajos" cardData={cardData} />
    </ShortcutsSection>
  );
};
const ShortcutsSection = styled.div`
    display: grid;
    gap: 1em;
    max-width: 1440px;
    width: 100%;
    margin: 0 auto;

    @media (max-width: 768px) {
        gap: 0.8em;
    }
`
