import styled from 'styled-components';

export const RetroactiveStack = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;
`;

export const RetroactiveSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-2);

  @media (width <= 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (width <= 460px) {
    grid-template-columns: 1fr;
  }
`;

export const RetroactiveGuidance = styled.p`
  margin: 0;
  padding: var(--ds-space-3);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
`;

export const RetroactiveSummaryItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: var(--ds-space-2);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-subtle);
`;

export const RetroactiveSummaryLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const RetroactiveSummaryValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
`;

export const RetroactiveTableWrap = styled.div`
  max-height: min(58vh, 520px);
  overflow: auto;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
`;

export const RetroactiveTable = styled.table`
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: var(--ds-font-size-sm);

  th,
  td {
    padding: var(--ds-space-2);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
    vertical-align: middle;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    color: var(--ds-color-text-secondary);
    background: var(--ds-color-bg-surface);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
  }

  th:nth-child(4),
  td:nth-child(4) {
    text-align: right;
    white-space: nowrap;
  }

  th:last-child,
  td:last-child {
    width: 1%;
    text-align: right;
    white-space: nowrap;
  }
`;

export const RetroactiveCellStack = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const RetroactivePrimaryText = styled.span`
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-semibold);
`;

export const RetroactiveMutedText = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const RetroactiveReasonText = styled(RetroactiveMutedText)`
  color: #92400e;
`;

export const RetroactiveEmpty = styled.div`
  padding: var(--ds-space-5);
  color: var(--ds-color-text-secondary);
  text-align: center;
`;

export const ModalActions = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
`;
