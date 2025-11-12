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
  background: #f0f0f0;
  color: #666;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    background: #e0e0e0;
  }
`;

const SingleColorTag = styled.div`
  background: #3f3f3f; /* Color único para todas las opciones */
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;
