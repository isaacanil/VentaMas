import styled from 'styled-components';

export const Container = styled.div`
  padding: 0 1em;
  margin-bottom: 1rem;
  background: white;

  @media (width <= 768px) {
    padding: 0.5rem;
    overflow-x: auto;
  }
`;

export const MobileContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.8em 1em;
  background-color: var(--white);
  border-bottom: 1px solid var(--gray);
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);
`;

export const MobileFiltersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 300px;
  padding: 1.5rem;
`;

export const MobileFilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const MobileFilterLabel = styled.label`
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #262626;
`;

export const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-end;

  @media (width <= 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`;

export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (width <= 768px) {
    width: 100%;

    & > * {
      width: 100% !important;
    }
  }
`;

export const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #262626;
`;
