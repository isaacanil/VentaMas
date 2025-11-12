import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../features/auth/userSlice';
import { userAccess } from '../../../../../hooks/abilities/useAbilities';
import { getDeveloperFeaturesData, getMenuCardData } from '../../CardData';
import { FeatureCardList } from '../FeatureCardList/FeatureCardList';

import type { FeatureCardData } from '../FeatureCardList/FeatureCard';
import type { JSX } from 'react';

const isFeatureCardData = (card: unknown): card is FeatureCardData => {
  if (!card || typeof card !== 'object') return false;
  const candidate = card as Partial<FeatureCardData>;
  return typeof candidate.title === 'string' && typeof candidate.category === 'string';
};

const normalizeCardData = (data: unknown): FeatureCardData[] => {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(isFeatureCardData);
};

export const DashboardShortcuts = (): JSX.Element => {
  const user: unknown = useSelector(selectUser);
  const cardData = normalizeCardData(getMenuCardData(user));
  const developer = normalizeCardData(getDeveloperFeaturesData());
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
