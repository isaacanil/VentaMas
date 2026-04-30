import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Skeleton, Typography } from 'antd';
import { m, useReducedMotion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { FeatureCard, type FeatureCardData } from './FeatureCard';

import type { JSX } from 'react';

interface FeatureCardListProps {
  title?: string;
  cardData: FeatureCardData[];
  loading?: boolean;
  categoryOrder?: Record<string, number>;
  wideCategoryNames?: string[];
}

export const FeatureCardList = ({
  title,
  cardData,
  loading = false,
  categoryOrder = {},
  wideCategoryNames = [],
}: FeatureCardListProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion && cardData.length <= 40;
  const categories = useMemo(() => {
    return cardData.reduce<Record<string, FeatureCardData[]>>((acc, card) => {
      const categoryKey = card.category || 'General';
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(card);
      return acc;
    }, {});
  }, [cardData]);
  const categoryEntries = useMemo(
    () => Object.entries(categories),
    [categories],
  );

  const [isCollapsed, setIsCollapsed] = useState(false);
  const handleToggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const listContent = (
    <Wrapper>
      {loading ? (
        <LoadingContainer>
          <Skeleton active />
        </LoadingContainer>
      ) : categoryEntries.length === 0 ? (
        <EmptyMessage>No hay elementos disponibles para mostrar.</EmptyMessage>
      ) : (
        categoryEntries.map(([category, cards]) => {
          const isWideCategory = wideCategoryNames.includes(category);
          return (
            <Category
              key={category}
              $isWide={isWideCategory}
              $order={categoryOrder[category] ?? 100}
            >
              <CategoryHeader>{category}</CategoryHeader>
              {shouldAnimate ? (
                <MotionFeatureContainer
                  $cardsCount={cards.length}
                  $isWide={isWideCategory}
                  variants={featureContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                >
                  {cards.map((card, index) => (
                    <CardMotionWrapper
                      key={card.id ?? `${category}-${index}`}
                      variants={featureCardVariants}
                    >
                      <FeatureCard card={card} />
                    </CardMotionWrapper>
                  ))}
                </MotionFeatureContainer>
              ) : (
                <StaticFeatureContainer
                  $cardsCount={cards.length}
                  $isWide={isWideCategory}
                >
                  {cards.map((card, index) => (
                    <CardStaticWrapper key={card.id ?? `${category}-${index}`}>
                      <FeatureCard card={card} />
                    </CardStaticWrapper>
                  ))}
                </StaticFeatureContainer>
              )}
            </Category>
          );
        })
      )}
    </Wrapper>
  );

  return (
    <Container>
      <Header onClick={handleToggle}>
        <Title level={4}>{title}</Title>
        <Button
          type="text"
          icon={
            isCollapsed ? (
              <FontAwesomeIcon icon={faChevronDown} size="lg" />
            ) : (
              <FontAwesomeIcon icon={faChevronUp} size="lg" />
            )
          }
          style={{ color: '#2c3e50' }}
        />
      </Header>
      {!isCollapsed && listContent}
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  gap: 0.8em;
  padding: 1em;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 5%);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
`;

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.8em;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const Category = styled.div<{ $isWide: boolean; $order: number }>`
  display: grid;
  gap: 0.2em;
  align-content: start;
  min-width: 0;
  padding: 0.6em;
  order: ${(props) => props.$order};
  background-color: #fafafa;
  border-radius: 8px;
  grid-column: ${(props) => (props.$isWide ? 'span 2' : 'span 1')};

  @media (width <= 768px) {
    grid-column: 1 / -1;
  }
`;

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const featureContainerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.06,
      duration: 0.1,
      ease: easeOut,
    },
  },
};

const featureCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOut },
  },
};

const viewportOnce = { once: true, amount: 0.25 };

const resolveFeatureColumns = ({
  $cardsCount,
  $isWide,
}: {
  $cardsCount: number;
  $isWide: boolean;
}) => {
  if ($cardsCount === 1) return '1fr';
  if ($isWide) return 'repeat(2, minmax(180px, 1fr))';
  return 'repeat(auto-fit, minmax(230px, 1fr))';
};

const MotionFeatureContainer = styled(m.div)<{
  $cardsCount: number;
  $isWide: boolean;
}>`
  display: grid;
  grid-template-columns: ${resolveFeatureColumns};
  gap: 0.4em;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const StaticFeatureContainer = styled.div<{
  $cardsCount: number;
  $isWide: boolean;
}>`
  display: grid;
  grid-template-columns: ${resolveFeatureColumns};
  gap: 0.4em;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const CardMotionWrapper = styled(m.div)`
  width: 100%;
`;

const CardStaticWrapper = styled.div`
  width: 100%;
`;

const Title = styled(Typography.Title)`
  margin: 0 !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  color: #2c3e50 !important;
`;

const CategoryHeader = styled.span`
  padding: 0 0.4em;
  font-size: 1em;
  font-weight: 600;
  color: #34495e;
`;

const EmptyMessage = styled.div`
  grid-column: 1 / -1;
  padding: 1em;
  text-align: center;
  color: #888;
  font-style: italic;
`;

const LoadingContainer = styled.div`
  grid-column: 1 / -1;
`;
