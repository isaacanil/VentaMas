import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  MobileMenuGroup as StyledMobileMenuGroup,
  MobileMenuGroupHeader,
  MobileMenuGroupItems,
} from '../Nav.styles';

import { MobileMenuItem } from './MobileMenuItem';

import type { GroupedMenuItem } from '../types';

interface MobileMenuGroupProps {
  group: GroupedMenuItem;
  activeTab: string;
  activeItemKey: string;
  isOpen: boolean;
  onToggle: (groupKey: string, event: React.MouseEvent) => void;
  onItemClick: (key: string) => void;
  openItems: Record<string, boolean>;
  onToggleChildren: (itemKey: string, event: React.MouseEvent) => void;
}

export const MobileMenuGroup = ({
  group,
  activeTab,
  activeItemKey,
  isOpen,
  onToggle,
  onItemClick,
  openItems,
  onToggleChildren,
}: MobileMenuGroupProps) => {
  return (
    <StyledMobileMenuGroup>
      <MobileMenuGroupHeader
        onClick={(e) => onToggle(group.key, e)}
        $isOpen={isOpen}
      >
        <div className="group-title">
          {group.icon && <span className="group-icon">{group.icon}</span>}
          <span>{group.label}</span>
        </div>
        <FontAwesomeIcon icon={faChevronDown} className="group-arrow" />
      </MobileMenuGroupHeader>
      <MobileMenuGroupItems $isOpen={isOpen}>
        {group.items.map((item) => (
          <MobileMenuItem
            key={item.key}
            item={item}
            activeTab={activeTab}
            activeItemKey={activeItemKey}
            isChildrenOpen={!!openItems[item.key]}
            onClick={onItemClick}
            onToggleChildren={onToggleChildren}
          />
        ))}
      </MobileMenuGroupItems>
    </StyledMobileMenuGroup>
  );
};
