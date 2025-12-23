import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


import { MenuGroupContainer, SidebarRow, MenuGroupItems } from '../Nav.styles';

import { SidebarItem } from './SidebarItem';

import type { GroupedMenuItem } from '../types';

interface SidebarGroupProps {
    group: GroupedMenuItem;
    activeTab: string;
    isCollapsed: boolean;
    isOpen: boolean;
    onToggle: (groupKey: string, event: React.MouseEvent) => void;
    onItemClick: (key: string) => void;
}

export const SidebarGroup = ({
    group,
    activeTab,
    isCollapsed,
    isOpen,
    onToggle,
    onItemClick,
}: SidebarGroupProps) => {
    return (
        <MenuGroupContainer>
            <SidebarRow
                onClick={(e) => onToggle(group.key, e)}
                $isOpen={isOpen}
                $collapsed={isCollapsed}
                $isGroup={true}
                $active={false}
            >
                <div className="row-content">
                    {group.icon && <div className="row-icon">{group.icon}</div>}
                    <span className="row-label">{group.label}</span>
                </div>
                <FontAwesomeIcon icon={faChevronDown} className="row-arrow" />
            </SidebarRow>
            <MenuGroupItems $isOpen={isOpen} $collapsed={isCollapsed}>
                {group.items.map((item) => (
                    <SidebarItem
                        key={item.key}
                        item={item}
                        activeTab={activeTab}
                        isCollapsed={isCollapsed}
                        onClick={onItemClick}
                    />
                ))}
            </MenuGroupItems>
        </MenuGroupContainer>
    );
};
