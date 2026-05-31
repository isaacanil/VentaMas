import styled from 'styled-components';

export const PeriodsToolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 380px) max-content;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: start;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.9fr);
  gap: var(--ds-space-4);
  align-items: start;

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

export const SideStack = styled.div`
  display: grid;
  gap: var(--ds-space-4);
  min-width: 0;
`;
