import styled, { keyframes } from 'styled-components';

const backdropIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

export const TriggerButton = styled.button`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: var(--ds-radius-md);
  background: transparent;
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    background: var(--ds-color-interactive-hover-bg);
    color: var(--ds-color-action-primary);
  }
`;

export const TriggerIcon = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  font-size: 16px;
`;

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  background: var(--ds-color-overlay-mask);
  animation: ${backdropIn} 0.15s ease;
  backdrop-filter: blur(4px);
`;

export const SpotlightPanel = styled.div`
  width: 100%;
  max-width: 560px;
  margin: 0 16px;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: 14px;
  background: var(--ds-color-bg-surface);
  box-shadow: var(--ds-shadow-lg);
  animation: ${panelIn} 0.18s cubic-bezier(0.22, 1, 0.36, 1);
`;

export const InputRow = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: center;
  padding: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
`;

export const SpotlightSearchIcon = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  color: var(--ds-color-text-secondary);
  font-size: 16px;
`;

export const SpotlightInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-base);
  font-size: var(--ds-font-size-md);

  &::placeholder {
    color: var(--ds-color-text-secondary);
  }
`;

export const ClearBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: none;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: var(--ds-color-text-secondary);
  }
`;

export const EscBadge = styled.kbd`
  flex-shrink: 0;
  padding: 2px 6px;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-base);
  font-size: 0.72rem;
`;

export const ResultsList = styled.div`
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
`;

export const ResultItem = styled.button<{ $active: boolean }>`
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--ds-radius-lg);
  background: ${(p) =>
    p.$active ? 'var(--ds-color-interactive-selected-bg)' : 'transparent'};
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;

  &:hover {
    background: var(--ds-color-interactive-hover-bg);
  }
`;

export const ResultIcon = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-size: 13px;
`;

export const ResultBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ResultTitle = styled.span`
  display: block;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
`;

export const ResultMeta = styled.span`
  display: block;
  margin-top: 1px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

export const ResultArrow = styled.span`
  flex-shrink: 0;
  color: var(--ds-color-text-secondary);
  font-size: 0.72rem;
`;

export const Empty = styled.div`
  padding: 20px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-base);
  text-align: center;
`;
