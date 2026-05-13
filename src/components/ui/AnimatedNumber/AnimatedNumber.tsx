import styled from 'styled-components';

import AnimatedDigit from '@/components/ui/AnimatedDigit/AnimatedDigit';

export const AnimatedNumber = ({ value }) => {
  let position = 0;
  const digits = String(value).split('').map((digit) => {
    const key = `${position}-${digit}`;
    position += 1;
    return { digit, key };
  });

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
