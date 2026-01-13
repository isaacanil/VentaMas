import {
    faChevronRight,
    faAngleLeft,
    faAngleRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fragment } from 'react';

import { MobileMenuGroup } from './components/MobileMenuGroup';
import { MobileMenuItem } from './components/MobileMenuItem';
import { SidebarGroup } from './components/SidebarGroup';
import { SidebarItem } from './components/SidebarItem';
import { useNavLogic } from './hooks/useNavLogic';
import {
    AppLayout,
    MainLayout,
    Sidebar,
    CollapseButton,
    SidebarTitle,
    GroupLabel,
    PageContainer,
    MobileWrapper,
    MobileSelector,
    MobileButton,
    Backdrop,
    MobileMenuContainer,
    MobileMenuContent,
    MobileMenuTitle,
    ContentWrapper,
    Content,
} from './Nav.styles';

import type { NavProps, GroupedMenuItem } from './types';

export function Nav({
    menuItems,
    activeTab,
    onTabChange,
    header,
    children,
    title,
}: NavProps) {
    const {
        isMenuOpen,
        setIsMenuOpen,
        isCollapsed,
        setIsCollapsed,
        openGroups,
        toggleGroup,
        handleMenuItemClick,
        groupedMenuItems,
    } = useNavLogic(menuItems, activeTab, onTabChange);

    return (
        <AppLayout>
            {header}

            <MainLayout>
                <Sidebar $collapsed={isCollapsed}>
                    <CollapseButton
                        $collapsed={isCollapsed}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <FontAwesomeIcon icon={isCollapsed ? faAngleRight : faAngleLeft} />
                    </CollapseButton>

                    {title && (
                        <SidebarTitle $collapsed={isCollapsed}>{title}</SidebarTitle>
                    )}

                    {groupedMenuItems.map((item) => {
                        if ((item as GroupedMenuItem).isGroup) {
                            const group = item as GroupedMenuItem;
                            if (group.groupType === 'labelled') {
                                return (
                                    <Fragment key={group.key}>
                                        <GroupLabel $collapsed={isCollapsed}>
                                            {group.label}
                                        </GroupLabel>
                                        {group.items.map((subItem) => (
                                            <SidebarItem
                                                key={subItem.key}
                                                item={subItem}
                                                activeTab={activeTab}
                                                isCollapsed={isCollapsed}
                                                onClick={handleMenuItemClick}
                                            />
                                        ))}
                                    </Fragment>
                                );
                            } else {
                                return (
                                    <SidebarGroup
                                        key={group.key}
                                        group={group}
                                        activeTab={activeTab}
                                        isCollapsed={isCollapsed}
                                        isOpen={!!openGroups[group.key]}
                                        onToggle={toggleGroup}
                                        onItemClick={handleMenuItemClick}
                                    />
                                );
                            }
                        } else {
                            return (
                                <SidebarItem
                                    key={item.key}
                                    item={item as any}
                                    activeTab={activeTab}
                                    isCollapsed={isCollapsed}
                                    onClick={handleMenuItemClick}
                                />
                            );
                        }
                    })}
                </Sidebar>

                <PageContainer>
                    <MobileWrapper>
                        <MobileSelector>
                            <MobileButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                <span>
                                    {menuItems.find((item) => item.key === activeTab)?.label}
                                </span>
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    style={{
                                        transform: `rotate(${isMenuOpen ? '90deg' : '0deg'})`,
                                        transition: 'transform 0.3s ease',
                                        color: '#444',
                                    }}
                                />
                            </MobileButton>
                            <Backdrop
                                $isOpen={isMenuOpen}
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <MobileMenuContainer $isOpen={isMenuOpen}>
                                <MobileMenuContent>
                                    {title && <MobileMenuTitle>{title}</MobileMenuTitle>}
                                    {groupedMenuItems.map((item) =>
                                        (item as GroupedMenuItem).isGroup ? (
                                            <MobileMenuGroup
                                                key={item.key}
                                                group={item as GroupedMenuItem}
                                                activeTab={activeTab}
                                                isOpen={!!openGroups[item.key]}
                                                onToggle={toggleGroup}
                                                onItemClick={handleMenuItemClick}
                                            />
                                        ) : (
                                            <MobileMenuItem
                                                key={item.key}
                                                item={item as any}
                                                activeTab={activeTab}
                                                onClick={handleMenuItemClick}
                                            />
                                        ),
                                    )}
                                </MobileMenuContent>
                            </MobileMenuContainer>
                        </MobileSelector>
                    </MobileWrapper>

                    <ContentWrapper>
                        <Content>{children}</Content>
                    </ContentWrapper>
                </PageContainer>
            </MainLayout>
        </AppLayout>
    );
}
