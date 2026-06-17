import React from 'react';
import styled from 'styled-components';

type InfoCardElement = {
  label: string;
  value?: React.ReactNode;
};

type InfoCardProps = {
  title: React.ReactNode;
  elements: InfoCardElement[];
};

const StyledContainer = styled.div`
  height: auto;
  overflow: hidden;
  background-color: white;
  border: 1px solid #f0f0f0;
  border-radius: 0.4em;
`;

const StyledHeader = styled.div`
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const StyledTitle = styled.h2`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
`;

const StyledContent = styled.div`
  padding: 12px 16px;
`;

const StyledDetail = styled.p`
  margin-bottom: 0.4rem;
  font-size: 0.8rem;
  color: #4b5563;
`;

const StyledLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
`;

export const InfoCard = ({ title, elements }: InfoCardProps) => {
  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>{title}</StyledTitle>
      </StyledHeader>
      <StyledContent>
        {elements.map((element) => (
          <StyledDetail key={element.label}>
            <StyledLabel>{element.label}:</StyledLabel> {element.value ?? 'N/A'}
          </StyledDetail>
        ))}
      </StyledContent>
    </StyledContainer>
  );
};
