import type { ComponentType, ReactNode } from 'react';
import styled from 'styled-components';

type CardRendererProps<TItem> = {
  item: TItem;
  index: number;
};

type CardListProps<TItem> = {
  maxWidth?: number | string;
  data?: TItem[];
  card?: ReactNode | ComponentType<CardRendererProps<TItem>> | null;
};

const EMPTY_CARD_LIST_ITEMS: unknown[] = [];

const getItemKey = <TItem,>(item: TItem, index: number): string => {
  if (typeof item === 'object' && item !== null && 'id' in item) {
    const idValue = (item as { id?: string | number }).id;
    if (idValue !== undefined && idValue !== null) {
      return `${idValue}`;
    }
  }
  return `${index}`;
};

export const CardList = <TItem,>({
  maxWidth = 800,
  data = EMPTY_CARD_LIST_ITEMS as TItem[],
  card: CardComponent = null,
}: CardListProps<TItem>) => {
  const content = !CardComponent
    ? null
    : typeof CardComponent === 'function'
      ? data.map((item, index) => {
          const Component = CardComponent;
          return (
            <Component key={getItemKey(item, index)} item={item} index={index} />
          );
        })
      : CardComponent;

  return <Container $maxWidth={maxWidth}>{content}</Container>;
};

type ContainerProps = {
  $maxWidth: number | string;
};

const Container = styled.div<ContainerProps>`
  width: 100%;
  max-width: ${(props) =>
    typeof props.$maxWidth === 'number'
      ? `${props.$maxWidth}px`
      : props.$maxWidth};
  height: 100%;
`;
