import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

export interface SubscriptionSectionNavItem {
  key: string;
  label: string;
  icon: IconDefinition;
}

interface SubscriptionSectionNavProps {
  items: SubscriptionSectionNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export const SubscriptionSectionNav = ({
  items,
  activeKey,
  onSelect,
}: SubscriptionSectionNavProps) => (
  <Nav aria-label="Navegacion de suscripcion">
    <NavList>
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <NavItem key={item.key}>
            <NavButton
              type="button"
              onClick={() => onSelect(item.key)}
              $active={isActive}
              aria-current={isActive ? 'page' : undefined}
            >
              <NavIcon $active={isActive}>
                <FontAwesomeIcon icon={item.icon} />
              </NavIcon>
              <span>{item.label}</span>
            </NavButton>
          </NavItem>
        );
      })}
    </NavList>
  </Nav>
);

export default SubscriptionSectionNav;

const Nav = styled.nav`
  overflow-x: auto;
  padding-bottom: 2px;
`;

const NavList = styled.ul`
  display: inline-flex;
  gap: 10px;
  min-width: 100%;
  margin: 0;
  padding: 8px;
  list-style: none;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 96%), rgb(248 250 252 / 88%)),
    radial-gradient(circle at top right, rgb(14 165 233 / 8%), transparent 35%);
  box-shadow: 0 14px 28px rgb(15 23 42 / 5%);

  @media (max-width: 720px) {
    min-width: max-content;
  }
`;

const NavItem = styled.li`
  display: flex;
`;

const NavButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid
    ${(p) => (p.$active ? 'rgb(45 212 191 / 28%)' : 'transparent')};
  border-radius: 16px;
  background:
    ${(p) =>
      p.$active
        ? 'linear-gradient(135deg, #020617 0%, #07131d 70%, #06222b 100%)'
        : 'transparent'};
  color: ${(p) => (p.$active ? '#f8fafc' : '#334155')};
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${(p) =>
      p.$active ? 'rgb(45 212 191 / 34%)' : 'rgb(148 163 184 / 22%)'};
    background:
      ${(p) =>
        p.$active
          ? 'linear-gradient(135deg, #020617 0%, #07131d 70%, #06222b 100%)'
          : 'rgb(255 255 255 / 78%)'};
  }
`;

const NavIcon = styled.span<{ $active: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: ${(p) => (p.$active ? 'rgb(45 212 191 / 18%)' : '#e2e8f0')};
  color: ${(p) => (p.$active ? '#5eead4' : '#475569')};
  font-size: 0.88rem;
  transition:
    background 0.15s ease,
    color 0.15s ease;
`;
