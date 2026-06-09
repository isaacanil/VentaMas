import styled from 'styled-components';

export const PreviewStack = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;
`;

export const PreviewGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);
  margin: 0;

  @media (width <= 560px) {
    grid-template-columns: 1fr;
  }
`;

export const PreviewItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const PreviewLabel = styled.dt`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const PreviewValue = styled.dd`
  min-width: 0;
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

export const PreviewMessage = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

export const ModalActions = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
`;
