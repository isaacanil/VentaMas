import { SidebarRow } from '../Nav.styles';

import type { MenuItem } from '../types';

interface SidebarItemProps {
    item: MenuItem;
    activeTab: string;
    isCollapsed: boolean;
    onClick: (key: string) => void;
}

export const SidebarItem = ({
    item,
    activeTab,
    isCollapsed,
    onClick,
}: SidebarItemProps) => (
    <SidebarRow
        $active={activeTab === item.key}
        onClick={() => onClick(item.key)}
        $collapsed={isCollapsed}
        $isGroup={false}
    >
        <div className="row-content">
            {item.icon && <div className="row-icon">{item.icon}</div>}
            <span className="row-label">{item.label}</span>
        </div>
    </SidebarRow>
);
