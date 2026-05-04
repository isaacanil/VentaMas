import styled from 'styled-components';

export const PanelCard = styled.section`
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

export const PanelCardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-default);
`;

export const PanelCardTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

export const PanelCardMeta = styled.span`
  margin-left: var(--ds-space-2);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-regular);
`;

export const PanelBody = styled.div`
  padding: var(--ds-space-4);
`;
