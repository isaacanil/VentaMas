import React from 'react';
import styled from 'styled-components';

export const InsuranceTypesDisplay = ({ types = [] }) => {
  // Si no hay tipos, no renderizamos nada
  if (!types || types.length === 0) return null;

  const visibleTypes = types.slice(0, 2);
  const remainingCount = types.length - 2;

  return (
    <TagContainer>
      {visibleTypes.map((type, index) => (
        <SingleColorTag key={type.id || index}>{type.type}</SingleColorTag>
      ))}
      {remainingCount > 0 && <MoreTag>+{remainingCount}</MoreTag>}
    </TagContainer>
  );
};

const TagContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const MoreTag = styled.div`
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  background: #f0f0f0;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;

  &:hover {
    background: #e0e0e0;
    box-shadow: 0 4px 8px rgb(0 0 0 / 15%);
    transform: translateY(-2px);
  }
`;

const SingleColorTag = styled.div`
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background: #3f3f3f; /* Color único para todas las opciones */
  border-radius: 16px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgb(0 0 0 / 15%);
  }
`;
