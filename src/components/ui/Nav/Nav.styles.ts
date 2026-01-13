import styled from 'styled-components';

export const Sidebar = styled.div<{ $collapsed: boolean }>`
  position: relative;
  display: none;
  width: ${(props: { $collapsed: boolean }) => (props.$collapsed ? '60px' : '270px')};
  padding: 0.6em;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  transition: width 0.3s ease;

  @media (width >= 769px) {
    display: block;
  }
`;

export const SidebarTitle = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
  font-weight: 600;
  color: #444;
  white-space: nowrap;
  opacity: ${(props: { $collapsed: boolean }) => (props.$collapsed ? 0 : 1)};
  transition: opacity 0.2s ease;
`;

export const CollapseButton = styled.button<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 40px;
  max-width: 3em;
  height: 36px;
  margin-bottom: 8px;
  color: #444;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    color: #1890ff;
    background: #f0f0f0;
  }

  svg {
    font-size: 16px;
    transform: rotate(${(props: { $collapsed: boolean }) => (props.$collapsed ? '0deg' : '180deg')});
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
`;

export const MenuGroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 4px; /* Keep margin for collapsible groups */
`;

export const GroupLabel = styled.div<{ $collapsed: boolean }>`
  display: ${(props: { $collapsed: boolean }) => (props.$collapsed ? 'none' : 'block')};
  padding: 10px 12px 4px; /* Padding: more top/bottom, less bottom */
  margin-top: 8px; /* Add some space above the label */
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px; /* Smaller font size */
  font-weight: 600; /* Bold */
  color: #888; /* Grey color */
  text-transform: uppercase; /* Uppercase text */
  white-space: nowrap;
  opacity: ${(props: { $collapsed: boolean }) => (props.$collapsed ? 0 : 1)};
  transition: opacity 0.2s ease;

  /* Add margin only if not the very first item */
  &:not(:first-child) {
    margin-top: 16px;
  }
`;

interface SidebarRowProps {
    $active?: boolean;
    $collapsed: boolean;
    $isGroup?: boolean;
    $isOpen?: boolean;
}

export const SidebarRow = styled.div<SidebarRowProps>`
  align-items: center;
  border-radius: 6px;
  color: #666; /* Default color */
  cursor: pointer;
  display: flex;
  font-size: 14px;
  font-weight: 500;
  gap: 8px; /* Add gap for consistency */
  height: 3em; /* Ensure consistent height */
  justify-content: space-between; /* Keep space-between for potential arrow */
  margin-bottom: 2px; /* Add small gap between rows */
  padding: 10px 12px;
  white-space: nowrap;

  &:hover {
    color: #444; /* Hover color */
    background: #f0f0f0;
  }

  /* Active state styling (only applies if props.$active is true) */
  ${(props: SidebarRowProps) =>
        props.$active &&
        `
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
  `}

  .row-content {
    display: flex;
    flex-grow: 1; /* Allow content to take available space */
    gap: 6px;
    align-items: center;
    overflow: hidden; /* Hide overflow */
  }

  .row-icon {
    min-width: 22px;
    font-size: 16px;

    /* Icon color based on active state */
    color: ${(props: SidebarRowProps) => (props.$active ? '#1890ff' : '#666')};
    text-align: center;
  }

  .row-label {
    display: ${(props: SidebarRowProps) => (props.$collapsed ? 'none' : 'inline')};
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: ${(props: SidebarRowProps) => (props.$collapsed ? 0 : 1)};
    transition: opacity 0.2s ease;
  }

  .row-arrow {
    /* Only display arrow if it's a group and not collapsed */
    display: ${(props: SidebarRowProps) =>
        props.$isGroup && !props.$collapsed ? 'inline-block' : 'none'};
    padding-left: 5px; /* Add some space before arrow */
    margin-left: auto; /* Push arrow to the right */
    color: #666; /* Default arrow color */
    transform: rotate(${(props: SidebarRowProps) => (props.$isOpen ? '180deg' : '0deg')});
    transition: transform 0.3s ease;
  }
`;

export const MenuGroupItems = styled.div<{ $isOpen: boolean; $collapsed: boolean }>`
  display: ${(props: { $isOpen: boolean }) => (props.$isOpen ? 'flex' : 'none')};
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  margin-left: ${(props: { $collapsed: boolean }) =>
        props.$collapsed ? '0' : '12px'}; /* Keep indentation for group items */

  transition: all 0.3s ease;
`;

export const MobileSelector = styled.div`
  display: none;

  @media (width <= 768px) {
    position: relative;
    display: block;
  }
`;

export const MobileButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;

  span {
    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    white-space: nowrap;
  }
`;

export const Backdrop = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 998;
  display: ${(props: { $isOpen: boolean }) => (props.$isOpen ? 'block' : 'none')};
  background: rgb(0 0 0 / 40%);
`;

export const MobileMenuContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 999;
  pointer-events: ${(props: { $isOpen: boolean }) => (props.$isOpen ? 'all' : 'none')};
  background: #fff;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
  opacity: ${(props: { $isOpen: boolean }) => (props.$isOpen ? '1' : '0')};
  transform: translateY(${(props: { $isOpen: boolean }) => (props.$isOpen ? '0' : '-100%')});
  transition: all 0.3s ease;
`;

export const MobileMenuContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 80vh;
  padding: 0.6em;
  overflow-y: auto;
`;

export const MobileMenuItem = styled.div<{ $active?: boolean }>`
  align-items: center;
  border-radius: 6px;
  color: #444;
  cursor: pointer;
  display: flex;
  gap: 8px;
  padding: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }

  ${(props: { $active?: boolean }) =>
        props.$active &&
        `
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
  `}

  .menu-icon {
    width: 20px;
    font-size: 16px;
    color: #444;
    text-align: center;
  }

  .menu-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    white-space: nowrap;
  }
`;

export const MobileMenuGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const MobileMenuGroupHeader = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  border-radius: 6px;

  &:hover {
    background: #f5f5f5;
  }

  .group-title {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .group-icon {
    width: 20px;
    font-size: 16px;
    text-align: center;
  }

  .group-arrow {
    transform: rotate(${(props: { $isOpen: boolean }) => (props.$isOpen ? '180deg' : '0deg')});
    transition: transform 0.3s ease;
  }
`;

export const MobileMenuGroupItems = styled.div<{ $isOpen: boolean }>`
  display: ${(props: { $isOpen: boolean }) => (props.$isOpen ? 'flex' : 'none')};
  flex-direction: column;
  gap: 8px;
  padding-left: 8px;
  margin-top: 2px;
  margin-left: 12px;
  border-left: 1px solid #f0f0f0;
`;

export const AppLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f0f2f5;
`;

export const MainLayout = styled.div`
  display: flex;
  flex: 1;
  gap: 0.4em;
  width: 100%;
  height: calc(100vh - 64px);
  padding: 0 0.4em;
  overflow: hidden;

  @media (width <= 768px) {
    padding: 0.4em;
  }
`;

export const PageContainer = styled.div`
  display: flex;
  flex: 1;
  gap: 0.4em;
  overflow: hidden;

  @media (width <= 768px) {
    flex-direction: column;
    gap: 0.4em;
  }
`;

export const MobileWrapper = styled.div`
  display: none;

  @media (width <= 768px) {
    display: flex;
    flex-direction: column;
    gap: 0.4em;
    width: 100%;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
`;

export const Content = styled.div`
  flex: 1;
  width: 100%;
  padding: 0.2em 0.4em;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

export const MobileMenuTitle = styled.div`
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #444;
  border-bottom: 1px solid #f0f0f0;
`;
