import styled from 'styled-components';

type BreakdownListItem = {
  key: string;
  label: string;
  value: string;
  detail: string;
  share: number;
};

type BreakdownListProps = {
  title: string;
  subtitle: string;
  items: BreakdownListItem[];
  emptyMessage: string;
};

export const BreakdownList = ({
  title,
  subtitle,
  items,
  emptyMessage,
}: BreakdownListProps) => (
  <Section>
    <Header>
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
    </Header>

    {items.length > 0 ? (
      <List>
        {items.map((item) => (
          <Item key={item.key}>
            <ItemHeader>
              <ItemLabel>{item.label}</ItemLabel>
              <ItemValue>{item.value}</ItemValue>
            </ItemHeader>
            <ItemDetailRow>
              <ItemDetail>{item.detail}</ItemDetail>
              <ItemShare>{Math.round(item.share * 100)}%</ItemShare>
            </ItemDetailRow>
            <Track aria-hidden="true">
              <Fill style={{ width: `${Math.max(item.share * 100, 6)}%` }} />
            </Track>
          </Item>
        ))}
      </List>
    ) : (
      <EmptyState>{emptyMessage}</EmptyState>
    )}
  </Section>
);

const Section = styled.section`
  display: grid;
  gap: 1rem;
  padding: 1.1rem 1.15rem;
  background: var(--white);
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 10px;
`;

const Header = styled.header`
  display: grid;
  gap: 0.2rem;
`;

const Title = styled.h3`
  margin: 0;
  color: var(--black-3);
  font-size: 1rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--gray-6);
  font-size: 0.82rem;
  line-height: 1.45;
`;

const List = styled.div`
  display: grid;
  gap: 0.9rem;
`;

const Item = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const ItemHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
  justify-content: space-between;
`;

const ItemLabel = styled.span`
  overflow: hidden;
  color: var(--black-3);
  font-size: 0.9rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemValue = styled.strong`
  color: var(--black-3);
  font-size: 0.92rem;
  font-weight: 600;
  text-align: right;
`;

const ItemDetailRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
`;

const ItemDetail = styled.span`
  color: var(--gray-6);
  font-size: 0.78rem;
`;

const ItemShare = styled.span`
  color: var(--gray-7);
  font-size: 0.76rem;
  font-weight: 600;
`;

const Track = styled.div`
  width: 100%;
  height: 5px;
  overflow: hidden;
  background: rgb(15 23 42 / 6%);
  border-radius: 999px;
`;

const Fill = styled.div`
  height: 100%;
  background: #1d69a8;
  border-radius: inherit;
`;

const EmptyState = styled.p`
  margin: 0;
  color: var(--gray-6);
  font-size: 0.85rem;
`;
