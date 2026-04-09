import styled from 'styled-components';

import type {
  AccountingPanelItem,
  AccountingPanelKey,
} from '../utils/accountingPanels';
import {
  accountingDescriptionStyles,
  accountingFocusRingStyles,
  accountingHeaderCopyStyles,
  accountingTitleStyles,
} from './system/accountingPrimitives';

interface AccountingPanelNavProps {
  activeKey: AccountingPanelKey;
  items: AccountingPanelItem[];
  onChange: (key: AccountingPanelKey) => void;
}

export const AccountingPanelNav = ({
  activeKey,
  items,
  onChange,
}: AccountingPanelNavProps) => (
  <NavPanel>
    <NavHeader>
      <NavTitle>Contabilidad</NavTitle>
      <NavDescription>
        Empieza por catálogo y perfiles; luego ajusta bancos y moneda.
      </NavDescription>
    </NavHeader>

    <NavGrid>
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <NavButton
            key={item.key}
            type="button"
            $active={isActive}
            onClick={() => onChange(item.key)}
          >
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </NavButton>
        );
      })}
    </NavGrid>
  </NavPanel>
);

const NavPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding-bottom: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-default);
`;

const NavHeader = styled.div`
  ${accountingHeaderCopyStyles}
`;

const NavTitle = styled.h2`
  ${accountingTitleStyles}
`;

const NavDescription = styled.p`
  max-width: 62ch;
  ${accountingDescriptionStyles}
`;

const NavGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 1120px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const NavButton = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  align-items: flex-start;
  min-height: 96px;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: 1px solid
    ${(props) =>
      props.$active
        ? 'var(--ds-color-interactive-selected-border)'
        : 'var(--ds-color-border-default)'};
  border-radius: var(--ds-radius-lg);
  background: ${(props) =>
    props.$active
      ? 'var(--ds-color-interactive-selected-bg)'
      : 'var(--ds-color-bg-surface)'};
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease;
  ${accountingFocusRingStyles}

  &:hover {
    border-color: var(--ds-color-interactive-selected-border);
    background: ${(props) =>
      props.$active
        ? 'var(--ds-color-interactive-selected-bg)'
        : 'var(--ds-color-interactive-hover-bg)'};
  }

  strong {
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-tight);
    font-weight: var(--ds-font-weight-semibold);
    color: ${(props) =>
      props.$active
        ? 'var(--ds-color-interactive-selected-text)'
        : 'var(--ds-color-text-primary)'};
  }

  span {
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-line-height-normal);
    color: var(--ds-color-text-secondary);
  }
`;
