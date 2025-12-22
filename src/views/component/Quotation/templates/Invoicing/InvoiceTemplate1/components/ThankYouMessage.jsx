import React from 'react';
import styled from 'styled-components';

export const ThankYouMessage = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <CenteredContainer>
      <MessageText>{message}</MessageText>
    </CenteredContainer>
  );
};

// Estilos con styled-components
const CenteredContainer = styled.div`
  margin-top: 1em;

  /* display: flex;
  justify-content: center;
  align-items: center; */
  text-align: center;
`;

const MessageText = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #333;
`;
