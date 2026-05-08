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
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
`;

const Header = styled.header`
  display: grid;
  gap: var(--ds-space-1);
`;

const Title = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const List = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const Item = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const ItemHeader = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: baseline;
  justify-content: space-between;
`;

const ItemLabel = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  text-align: right;
`;

const ItemDetailRow = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
`;

const ItemDetail = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const ItemShare = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const Track = styled.div`
  width: 100%;
  height: 5px;
  overflow: hidden;
  background: var(--ds-color-bg-muted);
  border-radius: var(--ds-radius-pill);
`;

const Fill = styled.div`
  height: 100%;
  background: var(--ds-color-action-primary);
  border-radius: inherit;
`;

const EmptyState = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;
