import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import { useDeveloperFeaturesData, useMenuCardData } from '@/modules/home/pages/Home/CardData';
import { FeatureCardList } from '@/modules/home/pages/Home/components/FeatureCardList/FeatureCardList';

import type { FeatureCardData } from '@/modules/home/pages/Home/components/FeatureCardList/FeatureCard';
import type { JSX } from 'react';

const isFeatureCardData = (card: unknown): card is FeatureCardData => {
  if (!card || typeof card !== 'object') return false;
  const candidate = card as Partial<FeatureCardData>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.category === 'string'
  );
};

const normalizeCardData = (data: unknown): FeatureCardData[] => {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(isFeatureCardData);
};

export const DashboardShortcuts = (): JSX.Element => {
  const user = useSelector(selectUser);
  const cardData = normalizeCardData(useMenuCardData(user));
  const developer = normalizeCardData(useDeveloperFeaturesData());
  const { abilities, loading } = useUserAccess();

  return (
    <ShortcutsSection>
      {abilities?.can('developerAccess', 'all') && (
        <FeatureCardList
          title="Funciones de desarrollador"
          cardData={developer}
          loading={loading}
        />
      )}
      <FeatureCardList title="Atajos" cardData={cardData} loading={loading} />
    </ShortcutsSection>
  );
};
const ShortcutsSection = styled.div`
  display: grid;
  gap: 1em;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;

  @media (width <= 768px) {
    gap: 0.8em;
  }
`;
