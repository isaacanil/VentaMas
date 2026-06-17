import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const DetailLinkButton = styled(Link)`
  display: inline-flex;
  gap: var(--ds-space-1);
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 var(--ds-space-3);
  color: var(--ds-color-action-primary);
  text-decoration: none;
  white-space: nowrap;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-full);
  background: var(--ds-color-bg-subtle);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    border-color: var(--ds-color-border-focus);
    background: var(--ds-color-action-primary-subtle);
  }

  &:focus-visible {
    outline: 3px solid var(--ds-color-border-focus);
    outline-offset: 2px;
  }
`;
