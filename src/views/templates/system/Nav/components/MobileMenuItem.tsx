import { MobileMenuItem as StyledMobileMenuItem } from '../Nav.styles';

import type { MenuItem } from '../types';

interface MobileMenuItemProps {
    item: MenuItem;
    activeTab: string;
    onClick: (key: string) => void;
}

export const MobileMenuItem = ({
    item,
    activeTab,
    onClick,
}: MobileMenuItemProps) => (
    <StyledMobileMenuItem
        $active={activeTab === item.key}
        onClick={() => onClick(item.key)}
    >
        <span className="menu-icon">{item.icon}</span>
        <span className="menu-label">{item.label}</span>
    </StyledMobileMenuItem>
);
