import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  MobileMenuItem as StyledMobileMenuItem,
  MobileNestedMenuItems,
} from '../Nav.styles';
import { hasActiveDescendant } from '../utils/menuTree';
import type { MenuItem } from '../types';

interface MobileMenuItemProps {
  item: MenuItem;
  activeTab: string;
  activeItemKey: string;
  isChildrenOpen: boolean;
  onClick: (key: string) => void;
  onToggleChildren: (itemKey: string, event: React.MouseEvent) => void;
  level?: number;
}

export const MobileMenuItem = ({
  item,
  activeTab,
  activeItemKey,
  isChildrenOpen,
  onClick,
  onToggleChildren,
  level = 0,
}: MobileMenuItemProps) => {
  const hasChildren = !!item.children?.length;
  const hasActiveChild = hasChildren
    ? hasActiveDescendant(item, activeItemKey)
    : false;
  const isActive =
    activeItemKey === item.key ||
    activeTab === item.key ||
    (hasChildren && hasActiveChild);

  return (
    <>
      <StyledMobileMenuItem
        $active={isActive}
        $isOpen={isChildrenOpen}
        $nestedLevel={level}
        onClick={() => onClick(item.key)}
      >
        <span className="menu-icon">{item.icon}</span>
        <span className="menu-label">{item.label}</span>

        {hasChildren ? (
          <button
            type="button"
            className="menu-arrow-button"
            onClick={(event) => onToggleChildren(item.key, event)}
            aria-label={
              isChildrenOpen ? 'Ocultar subnavegacion' : 'Mostrar subnavegacion'
            }
          >
            <FontAwesomeIcon icon={faChevronDown} className="menu-arrow" />
          </button>
        ) : null}
      </StyledMobileMenuItem>

      {hasChildren ? (
        <MobileNestedMenuItems $isOpen={isChildrenOpen}>
          {item.children?.map((child) => (
            <MobileMenuItem
              key={child.key}
              item={child}
              activeTab={activeTab}
              activeItemKey={activeItemKey}
              isChildrenOpen={false}
              onClick={onClick}
              onToggleChildren={onToggleChildren}
              level={level + 1}
            />
          ))}
        </MobileNestedMenuItems>
      ) : null}
    </>
  );
};
