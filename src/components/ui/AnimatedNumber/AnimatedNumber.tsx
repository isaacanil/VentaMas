import styled from 'styled-components';

import AnimatedDigit from '@/components/ui/AnimatedDigit/AnimatedDigit';

export const AnimatedNumber = ({ value }) => {
  const digits = String(value)
    .split('')
    .map((digit, position) => ({ digit, key: `${position}-${digit}` }));

  return (
    <CounterContainer>
      {digits.map(({ digit, key }) => (
        <AnimatedDigit key={key} digit={digit} />
      ))}
    </CounterContainer>
  );
};

const CounterContainer = styled.div`
  display: flex;
  padding: 0 0.4em;
`;
