import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { MenuGroupContainer, NestedMenuItems, SidebarRow } from '../Nav.styles';
import { hasActiveDescendant } from '../utils/menuTree';
import type { MenuItem } from '../types';

interface SidebarItemProps {
  item: MenuItem;
  activeTab: string;
  activeItemKey: string;
  isCollapsed: boolean;
  isChildrenOpen: boolean;
  onClick: (key: string) => void;
  onToggleChildren: (itemKey: string, event: React.MouseEvent) => void;
  level?: number;
}

export const SidebarItem = ({
  item,
  activeTab,
  activeItemKey,
  isCollapsed,
  isChildrenOpen,
  onClick,
  onToggleChildren,
  level = 0,
}: SidebarItemProps) => {
  const hasChildren = !!item.children?.length;
  const hasActiveChild = hasChildren
    ? hasActiveDescendant(item, activeItemKey)
    : false;
  const isActive =
    activeItemKey === item.key ||
    activeTab === item.key ||
    (hasChildren && hasActiveChild);

  return (
    <MenuGroupContainer>
      <SidebarRow
        $active={isActive}
        onClick={() => onClick(item.key)}
        $collapsed={isCollapsed}
        $isGroup={hasChildren}
        $isOpen={isChildrenOpen}
        $nestedLevel={level}
      >
        <div className="row-content">
          {item.icon && <div className="row-icon">{item.icon}</div>}
          <span className="row-label">{item.label}</span>
        </div>

        {hasChildren ? (
          <button
            type="button"
            className="row-arrow-button"
            onClick={(event) => onToggleChildren(item.key, event)}
            aria-label={
              isChildrenOpen ? 'Ocultar subnavegacion' : 'Mostrar subnavegacion'
            }
          >
            <FontAwesomeIcon icon={faChevronDown} className="row-arrow" />
          </button>
        ) : null}
      </SidebarRow>

      {hasChildren ? (
        <NestedMenuItems $isOpen={isChildrenOpen} $collapsed={isCollapsed}>
          {item.children?.map((child) => (
            <SidebarItem
              key={child.key}
              item={child}
              activeTab={activeTab}
              activeItemKey={activeItemKey}
              isCollapsed={isCollapsed}
              isChildrenOpen={false}
              onClick={onClick}
              onToggleChildren={onToggleChildren}
              level={level + 1}
            />
          ))}
        </NestedMenuItems>
      ) : null}
    </MenuGroupContainer>
  );
};
