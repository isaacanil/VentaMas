import styled from 'styled-components';

import { formatNumber } from '@/utils/format';
import { formatPriceByCurrency } from '@/utils/format';
import type { SupportedDocumentCurrency } from '@/types/products';

type ShowcaseValueType = 'none' | 'number' | 'percent' | 'price';

interface ShowcaseProps {
  title: string;
  value: number;
  valueType?: ShowcaseValueType;
  description?: string | null;
  color?: boolean | string;
  priceCurrency?: SupportedDocumentCurrency;
  className?: string;
}

export function Showcase({
  title,
  value,
  valueType = 'none',
  description = null,
  color = false,
  priceCurrency = 'DOP',
  className,
}: ShowcaseProps) {
  const determineColor = () => {
    if (typeof color === 'boolean' && color === true) {
      return value >= 0 ? 'success-contained' : 'error-contained';
    }
    if (typeof color === 'string') {
      return color;
    }
    return '';
  };

  const formatting = (inputValue: number) => {
    switch (valueType) {
      case 'number':
        return formatNumber(inputValue);
      case 'percent':
        return `${inputValue}%`;
      case 'price':
        return formatPriceByCurrency(inputValue, priceCurrency);
      default:
    }
    return inputValue;
  };

  return (
    <Container $color={determineColor()} className={className}>
      <Title>{title}</Title>
      <Value>{formatting(value)}</Value>
      {description && <Description>{description}</Description>}
    </Container>
  );
}
type ShowcaseStyleProps = {
  $color?: string;
  theme?: {
    colors?: Record<string, { text?: string; bg?: string }>;
  };
};

const Container = styled.div<{ $color?: string }>`
  display: grid;
  justify-content: center;
  padding: 0.3em 0.6em;

  /* color: ${(props) => {
    if (
      props.color === 'success-contained' ||
      props.color === 'error-contained'
    ) {
      return `red`;
    } else if (props.color === 'default') {
      return 'var(--black)';
    } else {
      return props.color; // Esto manejará cualquier string de color CSS directamente
    }
  }}; */
  color: ${(props: ShowcaseStyleProps) =>
    props?.theme?.colors?.[props?.$color || '']?.text ?? ''};
  text-align: center;
  background-color: var(--white-2);
  background-color: ${(props: ShowcaseStyleProps) =>
    props?.theme?.colors?.[props?.$color || '']?.bg ?? ''};
  border-radius: 0.4em;
`;
const Value = styled.h2`
  margin: 0;
  font-size: 1.4em;
`;
const Title = styled.span`
  margin: 0;
  font-size: 1em;
  font-weight: 500;
`;
const Description = styled.span`
  margin: 0;
  font-size: 0.9em;
`;
