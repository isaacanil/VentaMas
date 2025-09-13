import React from 'react';
import styled from 'styled-components';

const StyledContainer = styled.div`
  background-color: white;
  border: 1px solid #f0f0f0;
  border-radius: 0.4em;
  overflow: hidden;
  height: auto;
`;

const StyledHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
`;

const StyledTitle = styled.h2`
  font-weight: 600;
  margin: 0;
  font-size: 0.875rem;
`;

const StyledContent = styled.div`
  padding: 12px 16px;
`;

const StyledDetail = styled.p`
  margin-bottom: 0.4rem;
  color: #4b5563;
  font-size: 0.8rem;
`;

const StyledLabel = styled.span`
  font-weight: 600;
  font-size: 0.8rem;
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

