import React from 'react';
import styled from 'styled-components';

const StyledContainer = styled.div`
  margin-top: 1rem;
  background-color: white;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
  height: auto;
`;

const StyledHeader = styled.div`
  padding: 0.4rem 1em ;
`;

const StyledTitle = styled.h2`
  font-weight: 600;
  margin: 0;
  font-size: 1.2rem;
`;

const StyledContent = styled.div`
  padding: 1rem;
`;

const StyledDetail = styled.p`
  margin-bottom: 0.4rem;
  color: #4b5563;
  font-size: 1em;
`;

const StyledLabel = styled.span`
  font-weight: 600;
  font-size: 0.9em;
  color: #4b5563;
`;

export const InfoCard = ({ title, elements }) => {
  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>{title}</StyledTitle>
      </StyledHeader>
      <StyledContent>
        {elements.map((element, index) => (
          <StyledDetail key={index}>
            <StyledLabel>{element.label}:</StyledLabel> {element.value ?? 'N/A'}
          </StyledDetail>
        ))}
      </StyledContent>
    </StyledContainer>
  );
};

