import { InfoCircleOutlined } from '@/constants/icons/antd';
import { Card, Tooltip, Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

interface OverviewCard {
  key: string;
  title: string;
  description: string;
  value: string | number;
}

interface OverviewCardsProps {
  cards: OverviewCard[];
  className?: string;
}

const Grid = styled.div`
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledCard = styled(Card)`
  border-radius: 10px;

  .ant-card-body {
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
`;

const Value = styled.span`
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.2;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

export const OverviewCards = ({ cards, className }: OverviewCardsProps) => (
  <Grid className={className}>
    {cards.map((card) => (
      <StyledCard key={card.key} bordered>
        <Value>{card.value}</Value>
        <TitleRow>
          <Text>{card.title}</Text>
          {card.description ? (
            <Tooltip title={card.description} placement="top">
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          ) : null}
        </TitleRow>
      </StyledCard>
    ))}
  </Grid>
);
