import styled from 'styled-components';

import type { JSX } from 'react';

type GreetingMessageProps = {
  greetingText: string;
  nameToDisplay: string;
};

export const GreetingMessage = ({
  greetingText,
  nameToDisplay,
}: GreetingMessageProps): JSX.Element => {
  return (
    <TextContainer>
      <StyledGreeting>
        {greetingText} <NameSpan>{nameToDisplay}</NameSpan>
      </StyledGreeting>
    </TextContainer>
  );
};

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledGreeting = styled.h1`
  margin: 0;
  font-family:
    'SF Pro Display',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-gray-700, #4a5568);
  letter-spacing: -0.5px;
`;

const NameSpan = styled.span`
  position: relative;
  font-weight: 700;
  color: var(--color-primary-600, #3182ce);

  &::after {
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    content: '';
    background: linear-gradient(
      to right,
      var(--color-primary-400, #63b3ed),
      var(--color-primary-600, #3182ce)
    );
    border-radius: 2px;
    opacity: 0.8;
  }
`;
