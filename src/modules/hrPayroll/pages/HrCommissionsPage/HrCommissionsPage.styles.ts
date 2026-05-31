import styled from 'styled-components';

export const CommissionsToolbar = styled.div`
  display: grid;
  grid-template-columns:
    minmax(220px, 320px) minmax(260px, 380px) minmax(180px, 240px)
    max-content;
  gap: var(--ds-space-3);
  align-items: center;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
