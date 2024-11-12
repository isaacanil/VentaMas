import React from 'react';
import styled from 'styled-components';

export const ThankYouMessage = ({message}) => {
    if(!message){
        return null
    }

  return (
    <CenteredContainer>
      <MessageText>{message}</MessageText>
    </CenteredContainer>
  );
};

// Estilos con styled-components
const CenteredContainer = styled.div`
  /* display: flex;
  justify-content: center;
  align-items: center; */
  text-align: center;
  margin-top: 1em;
`;

const MessageText = styled.p`
  font-size: 12px;
  line-height: 1.6;
  color: #333;
  margin: 0;
`;
