import styled from 'styled-components';

import { formatNumber } from '@/utils/format';
import { formatPrice } from '@/utils/format';

export function Showcase({
  title,
  value,
  valueType = 'none',
  description,
  color = false,
}) {
  const determineColor = () => {
    if (typeof color === 'boolean' && color === true) {
      return value >= 0 ? 'success-contained' : 'error-contained';
    }
    if (typeof color === 'string') {
      return color;
    }
    return '';
  };

  const formatting = (value) => {
    switch (valueType) {
      case 'number':
        return formatNumber(value);
      case 'percent':
        return `${value}%`;
      case 'price':
        return formatPrice(value);
      default:
    }
    return value;
  };

  return (
    <Container color={determineColor()}>
      <Title>{title}</Title>
      <Value>{formatting(value)}</Value>
      {description && <Description>{description}</Description>}
    </Container>
  );
}
const Container = styled.div`
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
  color: ${(props) => props?.theme?.colors[props?.color]?.text ?? ''};
  text-align: center;
  background-color: var(--white-2);
  background-color: ${(props) => props?.theme?.colors[props?.color]?.bg ?? ''};
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
