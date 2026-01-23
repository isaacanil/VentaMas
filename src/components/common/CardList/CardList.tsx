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
  data = [],
  card: CardComponent = null,
}: CardListProps<TItem>) => {
  const renderContent = () => {
    if (!CardComponent) {
      return null;
    }

    if (typeof CardComponent === 'function') {
      const Component = CardComponent;
      return data.map((item, index) => (
        <Component key={getItemKey(item, index)} item={item} index={index} />
      ));
    }

    return CardComponent;
  };

  return <Container $maxWidth={maxWidth}>{renderContent()}</Container>;
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
