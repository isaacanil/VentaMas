import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Nav,
  NavButton,
  NavIcon,
  NavItem,
  NavList,
} from './SubscriptionSectionNav.styles';

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
