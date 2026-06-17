import styled from 'styled-components';

export const Sidebar = styled.div<{ $collapsed: boolean }>`
  position: relative;
  display: none;
  width: ${(props: { $collapsed: boolean }) =>
    props.$collapsed ? '60px' : '270px'};
  min-width: ${(props: { $collapsed: boolean }) =>
    props.$collapsed ? '60px' : '270px'};
  padding: var(--ds-space-2);
  background: var(--ds-color-bg-surface);
  border-right: 1px solid var(--ds-color-border-default);
  transition: width 0.3s ease;
  overflow-y: auto;
  overflow-x: hidden;
  align-self: stretch;

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
  color: var(--ds-color-text-primary);
  white-space: nowrap;
  opacity: ${(props: { $collapsed: boolean }) => (props.$collapsed ? 0 : 1)};
  transition: opacity 0.2s ease;
`;

export const SidebarHeaderSlot = styled.div`
  flex: 1;
  min-width: 0;
`;

export const SidebarTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-2);
`;

export const CollapseButton = styled.button<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
  width: 36px;
  height: 36px;
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--ds-radius-md);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    color: var(--ds-color-action-primary);
    background: var(--ds-color-interactive-hover-bg);
  }

  svg {
    font-size: 16px;
    transform: rotate(
      ${(props: { $collapsed: boolean }) =>
        props.$collapsed ? '0deg' : '180deg'}
    );
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
  display: ${(props: { $collapsed: boolean }) =>
    props.$collapsed ? 'none' : 'block'};
  padding: 10px 12px 4px; /* Padding: more top/bottom, less bottom */
  margin-top: 8px; /* Add some space above the label */
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px; /* Smaller font size */
  font-weight: 600; /* Bold */
  color: var(--ds-color-text-secondary);
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
  $nestedLevel?: number;
}

export const SidebarRow = styled.div<SidebarRowProps>`
  align-items: center;
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  display: flex;
  font-size: 14px;
  font-weight: 500;
  gap: 8px; /* Add gap for consistency */
  height: 3em; /* Ensure consistent height */
  justify-content: space-between; /* Keep space-between for potential arrow */
  margin-bottom: 2px; /* Add small gap between rows */
  padding: 10px
    ${(props: SidebarRowProps) =>
      props.$nestedLevel ? `${12 + props.$nestedLevel * 10}px` : '12px'};
  white-space: nowrap;

  &:hover {
    color: var(--ds-color-text-primary);
    background: var(--ds-color-interactive-hover-bg);
  }

  /* Active state: background only for leaf items, color for all active rows */
  ${(props: SidebarRowProps) =>
    props.$active &&
    !props.$isGroup &&
    `
    background: var(--ds-color-interactive-selected-bg);
  `}

  ${(props: SidebarRowProps) =>
    props.$active &&
    `
    color: var(--ds-color-action-primary);
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
    color: ${(props: SidebarRowProps) =>
      props.$active
        ? 'var(--ds-color-action-primary)'
        : 'var(--ds-color-text-secondary)'};
    text-align: center;
  }

  .row-label {
    display: ${(props: SidebarRowProps) =>
      props.$collapsed ? 'none' : 'inline'};
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: ${(props: SidebarRowProps) =>
      props.$nestedLevel ? '13px' : '14px'};
    opacity: ${(props: SidebarRowProps) => (props.$collapsed ? 0 : 1)};
    transition: opacity 0.2s ease;
  }

  .row-arrow-button {
    display: ${(props: SidebarRowProps) =>
      props.$isGroup && !props.$collapsed ? 'inline-flex' : 'none'};
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    margin-left: auto;
    color: var(--ds-color-text-secondary);
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: var(--ds-radius-sm);

    &:hover {
      background: var(--ds-color-interactive-hover-bg);
      color: var(--ds-color-text-primary);
    }
  }

  .row-arrow {
    display: ${(props: SidebarRowProps) =>
      props.$isGroup && !props.$collapsed ? 'inline-block' : 'none'};
    transform: rotate(
      ${(props: SidebarRowProps) => (props.$isOpen ? '180deg' : '0deg')}
    );
    transition: transform 0.3s ease;
  }
`;

export const NestedMenuItems = styled.div<{
  $isOpen: boolean;
  $collapsed: boolean;
}>`
  display: ${(props: { $isOpen: boolean }) =>
    props.$isOpen ? 'flex' : 'none'};
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  margin-left: ${(props: { $collapsed: boolean }) =>
    props.$collapsed ? '0' : '12px'};
  padding-left: ${(props: { $collapsed: boolean }) =>
    props.$collapsed ? '0' : '6px'};
  border-left: ${(props: { $collapsed: boolean }) =>
    props.$collapsed ? 'none' : '1px solid var(--ds-color-border-subtle)'};
`;

export const MenuGroupItems = styled.div<{
  $isOpen: boolean;
  $collapsed: boolean;
}>`
  display: ${(props: { $isOpen: boolean }) =>
    props.$isOpen ? 'flex' : 'none'};
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
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);

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
  display: ${(props: { $isOpen: boolean }) =>
    props.$isOpen ? 'block' : 'none'};
  background: var(--ds-color-overlay-mask);
`;

export const MobileMenuContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 999;
  pointer-events: ${(props: { $isOpen: boolean }) =>
    props.$isOpen ? 'all' : 'none'};
  background: var(--ds-color-bg-surface);
  border-radius: 0 0 12px 12px;
  box-shadow: var(--ds-shadow-md);
  opacity: ${(props: { $isOpen: boolean }) => (props.$isOpen ? '1' : '0')};
  transform: translateY(
    ${(props: { $isOpen: boolean }) => (props.$isOpen ? '0' : '-100%')}
  );
  transition: all 0.3s ease;
`;

export const MobileMenuContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  max-height: 80vh;
  padding: var(--ds-space-2);
  overflow-y: auto;
`;

export const MobileMenuItem = styled.div<{
  $active?: boolean;
  $isOpen?: boolean;
  $nestedLevel?: number;
}>`
  align-items: center;
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-text-primary);
  cursor: pointer;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding: 12px
    ${(props: { $nestedLevel?: number }) =>
      props.$nestedLevel ? `${12 + props.$nestedLevel * 10}px` : '12px'};
  transition: all 0.2s ease;

  &:hover {
    background: var(--ds-color-interactive-hover-bg);
  }

  ${(props: { $active?: boolean }) =>
    props.$active &&
    `
    background: var(--ds-color-interactive-selected-bg);
    color: var(--ds-color-action-primary);
    font-weight: 500;
  `}

  .menu-icon {
    width: 20px;
    font-size: 16px;
    color: currentColor;
    text-align: center;
  }

  .menu-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    white-space: nowrap;
  }

  .menu-arrow-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: var(--ds-radius-sm);

    &:hover {
      background: var(--ds-color-interactive-hover-bg);
    }
  }

  .menu-arrow {
    transform: rotate(
      ${(props: { $isOpen?: boolean }) => (props.$isOpen ? '180deg' : '0deg')}
    );
    transition: transform 0.3s ease;
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
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  border-radius: var(--ds-radius-md);

  &:hover {
    background: var(--ds-color-interactive-hover-bg);
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
    transform: rotate(
      ${(props: { $isOpen: boolean }) => (props.$isOpen ? '180deg' : '0deg')}
    );
    transition: transform 0.3s ease;
  }
`;

export const MobileMenuGroupItems = styled.div<{ $isOpen: boolean }>`
  display: ${(props: { $isOpen: boolean }) =>
    props.$isOpen ? 'flex' : 'none'};
  flex-direction: column;
  gap: 8px;
  padding-left: 8px;
  margin-top: 2px;
  margin-left: 12px;
  border-left: 1px solid var(--ds-color-border-subtle);
`;

export const MobileNestedMenuItems = styled.div<{ $isOpen: boolean }>`
  display: ${(props: { $isOpen: boolean }) =>
    props.$isOpen ? 'flex' : 'none'};
  flex-direction: column;
  gap: 8px;
  padding-left: 8px;
  margin-top: 2px;
  margin-left: 12px;
  border-left: 1px solid var(--ds-color-border-subtle);
`;

export const AppLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--ds-color-bg-page);
`;

export const MainLayout = styled.div`
  display: flex;
  flex: 1;
  gap: 0em;
  width: 100%;
  height: calc(100vh - 64px);
  overflow: hidden;
`;

export const PageContainer = styled.div`
  display: flex;
  flex: 1;
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
  overflow-y: auto;
  background: var(--ds-color-bg-page);

  @media (width <= 768px) {
    padding: var(--ds-space-1) 0;
  }
`;

export const MobileMenuTitle = styled.div`
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--ds-color-text-primary);
  border-bottom: 1px solid var(--ds-color-border-subtle);
`;
