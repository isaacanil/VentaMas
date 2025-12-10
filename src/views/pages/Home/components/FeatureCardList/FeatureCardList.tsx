import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Skeleton, Typography } from 'antd';
import { m, LazyMotion, domAnimation } from 'framer-motion';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { FeatureCard, type FeatureCardData } from './FeatureCard';

import type { JSX } from 'react';

interface FeatureCardListProps {
  title?: string;
  cardData: FeatureCardData[];
  loading?: boolean;
}

export const FeatureCardList = ({
  title,
  cardData,
  loading = false,
}: FeatureCardListProps): JSX.Element => {
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

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Container>
      <Header onClick={() => setIsCollapsed((prev) => !prev)}>
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
      {!isCollapsed && (
        <LazyMotion features={domAnimation}>
          <Wrapper>
            {loading ? (
              <LoadingContainer>
                <Skeleton active />
              </LoadingContainer>
            ) : Object.keys(categories).length === 0 ? (
              <EmptyMessage>
                No hay elementos disponibles para mostrar.
              </EmptyMessage>
            ) : (
              Object.entries(categories).map(([category, cards]) => (
                <Category key={category}>
                  <CategoryHeader>{category}</CategoryHeader>
                  <FeatureContainer
                    cardsCount={cards.length}
                    variants={featureContainerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.25 }}
                  >
                    {cards.map((card, index) => (
                      <CardMotionWrapper
                        key={card.id ?? `${category}-${index}`}
                        variants={featureCardVariants}
                      >
                        <FeatureCard card={card} />
                      </CardMotionWrapper>
                    ))}
                  </FeatureContainer>
                </Category>
              ))
            )}
          </Wrapper>
        </LazyMotion>
      )}
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

const Category = styled.div`
  display: grid;
  gap: 0.2em;
  align-content: start;
  padding: 0.6em;
  background-color: #fafafa;
  border-radius: 8px;
`;

const featureContainerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.06,
      duration: 0.1,
      ease: 'easeOut',
    },
  },
};

const featureCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const FeatureContainer = styled(m.div)<{ cardsCount: number }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.cardsCount === 1 ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))'};
  gap: 0.4em;
`;

const CardMotionWrapper = styled(m.div)`
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


