import { useState, useMemo } from 'react';

import type { MenuItem, GroupedMenuItem, MenuListItem } from '../types';

export const useNavLogic = (
    menuItems: MenuItem[],
    activeTab: string,
    onTabChange: (key: string) => void,
) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [userToggledGroups, setUserToggledGroups] = useState<
        Record<string, boolean>
    >({});

    const groupedItemsByGroupKey = useMemo(
        () =>
            menuItems.reduce(
                (acc, item) => {
                    if (!item.group) {
                        return acc;
                    }

                    const groupKey = item.group;
                    if (!acc[groupKey]) {
                        acc[groupKey] = {
                            type: item.groupType || 'collapsible',
                            items: [],
                        };
                    }

                    acc[groupKey].items.push(item.key);
                    return acc;
                },
                {} as Record<string, { type: string; items: string[] }>,
            ),
        [menuItems],
    );

    const openGroups = useMemo(() => {
        const computed: Record<string, boolean> = {};

        Object.entries(groupedItemsByGroupKey).forEach(([groupKey]) => {
            if (userToggledGroups[groupKey] !== undefined) {
                computed[groupKey] = userToggledGroups[groupKey];
                return;
            }

            // Do not auto-expand groups based on activeTab
            // if (groupInfo.type !== 'labelled' && groupInfo.items.includes(activeTab)) {
            //    computed[groupKey] = true;
            // }
        });

        return computed;
    }, [groupedItemsByGroupKey, userToggledGroups]);

    const toggleGroup = (groupKey: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setUserToggledGroups((prev) => ({
            ...prev,
            [groupKey]: !openGroups[groupKey],
        }));
    };

    const handleMenuItemClick = (key: string) => {
        onTabChange(key);
        setIsMenuOpen(false);
    };

    const groupedMenuItems = useMemo(() => {
        return menuItems.reduce((acc, item) => {
            if (!item.group) {
                acc.push(item);
                return acc;
            }

            const existingGroupIndex = acc.findIndex(
                (g) =>
                    (g as GroupedMenuItem).isGroup &&
                    (g as GroupedMenuItem).key === item.group,
            );

            if (existingGroupIndex === -1) {
                const relatedItems = menuItems.filter(
                    (relItem) => relItem.group === item.group,
                );
                const groupType = (relatedItems[0]?.groupType ||
                    'collapsible') as GroupedMenuItem['groupType'];

                if (relatedItems.length > 1 || groupType === 'labelled') {
                    acc.push({
                        isGroup: true,
                        key: item.group,
                        label: item.groupLabel || item.group,
                        icon: item.groupIcon,
                        groupType: groupType,
                        items: [item],
                    } as GroupedMenuItem);
                } else {
                    acc.push(item);
                }
            } else {
                (acc[existingGroupIndex] as GroupedMenuItem).items.push(item);
            }
            return acc;
        }, [] as MenuListItem[]);
    }, [menuItems]);

    return {
        isMenuOpen,
        setIsMenuOpen,
        isCollapsed,
        setIsCollapsed,
        openGroups,
        toggleGroup,
        handleMenuItemClick,
        groupedMenuItems,
    };
};
