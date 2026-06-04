import styled from 'styled-components';

export const PeriodActionGroup = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;

  &[data-layout='toolbar'] {
    min-width: 0;
  }

  @media (max-width: 640px) {
    &[data-layout='toolbar'] {
      width: 100%;
      justify-content: stretch;
    }

    &[data-layout='toolbar'] > * {
      flex: 1 1 160px;
    }
  }
`;
