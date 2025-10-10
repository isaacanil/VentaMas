import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

export const GreetingMessage = ({ greetingText, nameToDisplay }) => {
  return (
    <TextContainer>
      <StyledGreeting>
        {greetingText} <NameSpan>{nameToDisplay}</NameSpan>
      </StyledGreeting>
    </TextContainer>
  );
};

GreetingMessage.propTypes = {
  greetingText: PropTypes.string.isRequired,
  nameToDisplay: PropTypes.string.isRequired,
};

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledGreeting = styled.h1`
  font-size: 1.4rem;
  font-weight: 600;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-gray-700, #4a5568);
  margin: 0;
  letter-spacing: -0.5px;
  line-height: 1.2;
`;

const NameSpan = styled.span`
  color: var(--color-primary-600, #3182ce);
  font-weight: 700;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(to right, var(--color-primary-400, #63b3ed), var(--color-primary-600, #3182ce));
    border-radius: 2px;
    opacity: 0.8;
  }
`;