import type { ReactNode } from 'react';

export type GroupType = 'collapsible' | 'labelled';

export interface MenuItem {
    key: string;
    label: string;
    icon?: ReactNode;
    group?: string;
    groupLabel?: string;
    groupIcon?: ReactNode;
    groupType?: GroupType;
}

export interface GroupedMenuItem {
    isGroup: boolean;
    key: string;
    label: string;
    icon?: ReactNode;
    groupType: GroupType;
    items: MenuItem[];
}

export type MenuListItem = MenuItem | GroupedMenuItem;

export interface NavProps {
    menuItems: MenuItem[];
    activeTab: string;
    onTabChange: (key: string) => void;
    header?: ReactNode;
    children: ReactNode;
    title?: string;
}
