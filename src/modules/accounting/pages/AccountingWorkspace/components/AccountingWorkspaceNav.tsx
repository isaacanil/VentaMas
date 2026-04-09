import styled from 'styled-components';

import type { AccountingWorkspacePanelItem } from '../utils/accountingPanels';
import type { AccountingWorkspacePanelKey } from '../utils/accountingWorkspace';

interface AccountingWorkspaceNavProps {
  activePanel: AccountingWorkspacePanelKey;
  items: AccountingWorkspacePanelItem[];
  onSelect: (route: string) => void;
}

export const AccountingWorkspaceNav = ({
  activePanel,
  items,
  onSelect,
}: AccountingWorkspaceNavProps) => (
  <NavScroll role="tablist" aria-label="Secciones del modulo contable">
    <Nav>
      {items.map((item) => {
        const isActive = item.key === activePanel;
        return (
          <NavButton
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            $active={isActive}
            title={item.description}
            onClick={() => onSelect(item.route)}
          >
            {item.label}
          </NavButton>
        );
      })}
    </Nav>
  </NavScroll>
);

const NavScroll = styled.div`
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  width: 100%;
  min-height: 48px;
  overflow-x: auto;
  overflow-y: visible;
  background: var(--ds-color-bg-surface);
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex: 1 1 auto;
  gap: 0;
  width: 100%;
  min-width: max-content;
`;

const NavButton = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 20px;
  border: none;
  border-bottom: 3px solid ${(props) =>
    props.$active
      ? 'var(--ds-color-interactive-selected-border)'
      : 'transparent'};
  margin-bottom: -1px;
  background: transparent;
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-tight);
  font-weight: ${(props) =>
    props.$active
      ? 'var(--ds-font-weight-semibold)'
      : 'var(--ds-font-weight-regular)'};
  color: ${(props) =>
    props.$active
      ? 'var(--ds-color-interactive-selected-text)'
      : 'var(--ds-color-text-secondary)'};
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    color 150ms ease,
    background-color 150ms ease;

  &:hover {
    color: var(--ds-color-text-primary);
    background: var(--ds-color-interactive-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: -2px;
  }

  @media (max-width: 560px) {
    min-height: 44px;
    padding: 10px 14px;
  }
`;
