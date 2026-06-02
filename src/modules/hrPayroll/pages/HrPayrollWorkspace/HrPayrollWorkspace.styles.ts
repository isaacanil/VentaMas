import styled from 'styled-components';

export const PayrollToolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 420px);
  gap: var(--ds-space-3);
  align-items: center;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;
