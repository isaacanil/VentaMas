import styled from 'styled-components';

export const FilterContainer = styled.div`
  margin: 16px 0;
  padding: 0 16px;

  .business-filter-select {
    min-width: 240px;
  }

  .role-filter-select {
    min-width: 180px;
  }
`;

export const BusinessOptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
`;

export const BusinessOptionName = styled.span`
  font-weight: 500;
`;

export const BusinessOptionId = styled.span`
  color: #6b7280;
  font-size: 12px;
`;
