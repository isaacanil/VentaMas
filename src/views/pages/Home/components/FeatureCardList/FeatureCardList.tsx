import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Typography } from 'antd';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { FeatureCard, type FeatureCardData } from './FeatureCard';

type FeatureCardListProps = {
  title?: string;
  cardData: FeatureCardData[];
};

export const FeatureCardList = ({ title, cardData }: FeatureCardListProps): JSX.Element => {
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
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => setIsCollapsed((prev) => !prev)}
      >
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
      </div>
      {!isCollapsed && (
        <Wrapper>
          {Object.entries(categories).map(([category, cards]) => (
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
                  <CardMotionWrapper key={card.id ?? `${category}-${index}`} variants={featureCardVariants}>
                    <FeatureCard card={card} />
                  </CardMotionWrapper>
                ))}
              </FeatureContainer>
            </Category>
          ))}
        </Wrapper>
      )}
    </Container>
  );
};
const Container = styled.div`
    display: grid;
    gap: 0.8em;
    background-color: #fff;
    padding: 1em;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
`

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.8em;
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`

const Category = styled.div`
    display: grid;
    gap: 0.2em;
    padding: 0.6em;
    align-content: start;
    border-radius: 8px;
    background-color: #fafafa;
`

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

const FeatureContainer = styled(motion.div)<{ cardsCount: number }>`
    display: grid;
    grid-template-columns: ${props => props.cardsCount === 1 ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))'};
    gap: 0.4em;
`

const CardMotionWrapper = styled(motion.div)`
    width: 100%;
`

const Title = styled(Typography.Title)`
    color: #2c3e50 !important;
    margin: 0 !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
`

const CategoryHeader = styled.span`
    font-size: 1em;
    font-weight: 600;
    color: #34495e;
    padding: 0 0.4em;
`;
