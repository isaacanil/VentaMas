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
import { findMenuItemByKey } from './utils/menuTree';
import {
  AppLayout,
  MainLayout,
  Sidebar,
  SidebarHeaderSlot,
  SidebarTopRow,
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
  activeItemKey = activeTab,
  onTabChange,
  header,
  sidebarHeader,
  children,
  title,
}: NavProps) {
  const {
    isMenuOpen,
    setIsMenuOpen,
    isCollapsed,
    setIsCollapsed,
    openGroups,
    openItems,
    toggleGroup,
    toggleItemChildren,
    handleMenuItemClick,
    groupedMenuItems,
  } = useNavLogic(menuItems, activeTab, onTabChange);
  const activeItemLabel =
    findMenuItemByKey(menuItems, activeItemKey)?.label ||
    menuItems.find((item) => item.key === activeTab)?.label;

  return (
    <AppLayout>
      {header}

      <MainLayout>
        <Sidebar $collapsed={isCollapsed}>
          <SidebarTopRow>
            {!isCollapsed && sidebarHeader && (
              <SidebarHeaderSlot>{sidebarHeader}</SidebarHeaderSlot>
            )}

            <CollapseButton
              $collapsed={isCollapsed}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <FontAwesomeIcon icon={isCollapsed ? faAngleRight : faAngleLeft} />
            </CollapseButton>
          </SidebarTopRow>

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
                        activeItemKey={activeItemKey}
                        isCollapsed={isCollapsed}
                        isChildrenOpen={!!openItems[subItem.key]}
                        onClick={handleMenuItemClick}
                        onToggleChildren={toggleItemChildren}
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
                    activeItemKey={activeItemKey}
                    isCollapsed={isCollapsed}
                    isOpen={!!openGroups[group.key]}
                    onToggle={toggleGroup}
                    onItemClick={handleMenuItemClick}
                    openItems={openItems}
                    onToggleChildren={toggleItemChildren}
                  />
                );
              }
            } else {
              return (
                <SidebarItem
                  key={item.key}
                  item={item as any}
                  activeTab={activeTab}
                  activeItemKey={activeItemKey}
                  isCollapsed={isCollapsed}
                  isChildrenOpen={!!openItems[item.key]}
                  onClick={handleMenuItemClick}
                  onToggleChildren={toggleItemChildren}
                />
              );
            }
          })}
        </Sidebar>

        <PageContainer>
          <MobileWrapper>
            <MobileSelector>
              <MobileButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <span>{activeItemLabel}</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  style={{
                    transform: `rotate(${isMenuOpen ? '90deg' : '0deg'})`,
                    transition: 'transform 0.3s ease',
                    color: 'var(--ds-color-text-secondary)',
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
                        activeItemKey={activeItemKey}
                        isOpen={!!openGroups[item.key]}
                        onToggle={toggleGroup}
                        onItemClick={handleMenuItemClick}
                        openItems={openItems}
                        onToggleChildren={toggleItemChildren}
                      />
                    ) : (
                      <MobileMenuItem
                        key={item.key}
                        item={item as any}
                        activeTab={activeTab}
                        activeItemKey={activeItemKey}
                        isChildrenOpen={!!openItems[item.key]}
                        onClick={handleMenuItemClick}
                        onToggleChildren={toggleItemChildren}
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
