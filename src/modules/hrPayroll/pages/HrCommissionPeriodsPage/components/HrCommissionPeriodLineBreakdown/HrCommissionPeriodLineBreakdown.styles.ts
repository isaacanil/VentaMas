import styled from 'styled-components';

export const LineBreakdownStack = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  margin-top: var(--ds-space-3);
`;

export const LineBreakdownTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

export const LineBreakdownItem = styled.details`
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-surface);

  &[open] {
    border-color: var(--ds-color-border-focus);
  }
`;

export const LineBreakdownSummary = styled.summary`
  display: grid;
  grid-template-columns: minmax(180px, 1fr) repeat(5, minmax(120px, max-content));
  gap: var(--ds-space-3);
  align-items: center;
  padding: var(--ds-space-3);
  cursor: pointer;
  list-style-position: inside;

  @media (max-width: 960px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const BreakdownMetric = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

export const BreakdownMetricLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-regular);
`;

export const LineBreakdownBody = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  padding: 0 var(--ds-space-3) var(--ds-space-3);
`;

export const LineBreakdownNote = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;

export const EntryTableScroll = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

export const EntryTable = styled.table`
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xs);

  th,
  td {
    padding: var(--ds-space-2);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
    vertical-align: top;
  }

  th {
    color: var(--ds-color-text-secondary);
    font-weight: var(--ds-font-weight-semibold);
    background: var(--ds-color-bg-subtle);
  }

  td[data-align='right'],
  th[data-align='right'] {
    text-align: right;
  }
`;

export const EmptyBreakdown = styled.div`
  padding: var(--ds-space-3);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  text-align: center;
  border: 1px dashed var(--ds-color-border-default);
  border-radius: 8px;
  background: var(--ds-color-bg-subtle);
`;
