import { useState, Fragment } from 'react'; // Add Fragment
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faAngleLeft, faAngleRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const Sidebar = styled.div`
  display: none;
  width: ${props => props.collapsed ? '60px' : '270px'};
  background: #fff;
  padding: 0.6em;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: width 0.3s ease;
  position: relative;

  @media (min-width: 769px) {
    display: block;
  }
`;

const SidebarTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #444;
  margin-bottom: 12px;
  padding: 0 12px;
  height: 36px;
  display: flex;
  align-items: center;
  opacity: ${props => props.collapsed ? 0 : 1};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: opacity 0.2s ease;
`;

const CollapseButton = styled.button`
  width: 100%;
  max-width: 3em;
  height: 36px;
  min-width: 40px;
  background: transparent;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 8px;
  color: #444;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    background: #f0f0f0;
    color: #1890ff;
  }

  svg {
    font-size: 16px;
    transform: rotate(${props => props.collapsed ? '0deg' : '180deg'});
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
`;

const MenuGroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 4px; /* Keep margin for collapsible groups */
`;

// New styled component for the simple label
const GroupLabel = styled.div`
  font-size: 11px; /* Smaller font size */
  font-weight: 600; /* Bold */
  color: #888; /* Grey color */
  text-transform: uppercase; /* Uppercase text */
  padding: 10px 12px 4px 12px; /* Padding: more top/bottom, less bottom */
  margin-top: 8px; /* Add some space above the label */
  opacity: ${props => props.collapsed ? 0 : 1};
  transition: opacity 0.2s ease;
  display: ${props => props.collapsed ? 'none' : 'block'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  /* Add margin only if not the very first item */
  &:not(:first-child) {
     margin-top: 16px;
  }
`;


const SidebarRow = styled.div`
  padding: 10px 12px;
  height: 3em; /* Ensure consistent height */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Keep space-between for potential arrow */
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #666; /* Default color */
  white-space: nowrap;
  gap: 8px; /* Add gap for consistency */
  margin-bottom: 2px; /* Add small gap between rows */

  &:hover {
    background: #f0f0f0;
    color: #444; /* Hover color */
  }

  /* Active state styling (only applies if props.active is true) */
  ${props => props.active && `
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
  `}

  .row-content {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-grow: 1; /* Allow content to take available space */
    overflow: hidden; /* Hide overflow */
  }

  .row-icon {
    min-width: 22px;
    font-size: 16px;
    text-align: center;
    /* Icon color based on active state */
    color: ${props => props.active ? '#1890ff' : '#666'};
  }

  .row-label {
    opacity: ${props => props.collapsed ? 0 : 1};
    transition: opacity 0.2s ease;
    display: ${props => props.collapsed ? 'none' : 'inline'};
    overflow: hidden;
    text-overflow: ellipsis;
    /* Removed max-width, rely on flex overflow */
  }

  .row-arrow {
    /* Only display arrow if it's a group and not collapsed */
    display: ${props => props.isGroup && !props.collapsed ? 'inline-block' : 'none'};
    transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
    transition: transform 0.3s ease;
    color: #666; /* Default arrow color */
    margin-left: auto; /* Push arrow to the right */
    padding-left: 5px; /* Add some space before arrow */
  }
`;

const MenuGroupItems = styled.div`
  margin-left: ${props => props.collapsed ? '0' : '12px'}; /* Keep indentation for group items */
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  transition: all 0.3s ease;
`;

const MobileSelector = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
    position: relative;
  }
`;

const MobileButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 80%;
    text-align: left;
  }
`;

const Backdrop = styled.div`
  display: ${props => props.isOpen ? 'block' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 998;
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 999;
  opacity: ${props => props.isOpen ? '1' : '0'};
  pointer-events: ${props => props.isOpen ? 'all' : 'none'};
  transition: all 0.3s ease;
  transform: translateY(${props => props.isOpen ? '0' : '-100%'});
  border-radius: 0 0 12px 12px;
`;

const MobileMenuContent = styled.div`
  padding: 0.6em;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;

`;

const MobileMenuItem = styled.div`
  padding: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #444;

  &:hover {
    background: #f5f5f5;
  }

  ${props => props.active && `
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
  `}

  .menu-icon {
    font-size: 16px;
    width: 20px;
    text-align: center;
    color: #444;
  }

  .menu-label {
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
`;

const MobileMenuGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const MobileMenuGroupHeader = styled.div`
  padding: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  
  &:hover {
    background: #f5f5f5;
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .group-icon {
    width: 20px;
    text-align: center;
    font-size: 16px;
  }

  .group-arrow {
    transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
    transition: transform 0.3s ease;
  }
`;

const MobileMenuGroupItems = styled.div`
  margin-left: 12px;
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;
  padding-left: 8px;
  border-left: 1px solid #f0f0f0;
`;

const AppLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
  overflow: hidden;
`;

const MainLayout = styled.div`
  flex: 1;
  gap: 0.4em;
  display: flex;
  width: 100%;
  padding: 0.4em;
  height: calc(100vh - 64px);
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 0.4em;
  }
`;

const PageContainer = styled.div`
  display: flex;
  gap: 0.4em;
  flex: 1;
  overflow: hidden;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.4em;
  }
`;

const MobileWrapper = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 0.4em;
    width: 100%;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  background: #fff;
  padding: 0.2em 0.4em;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex: 1;
  overflow-y: auto;

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

export function Nav({ menuItems, activeTab, onTabChange, header, children, title }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({});


  const toggleGroup = (groupKey, event) => {
    event.stopPropagation();
    setOpenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleMenuItemClick = (key) => {
    onTabChange(key);
    setIsMenuOpen(false); // Close mobile menu if open
  };


  // Update grouping logic to include groupType
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!item.group) {
      acc.push(item);
      return acc;
    }

    const existingGroupIndex = acc.findIndex(g => g.isGroup && g.key === item.group);

    if (existingGroupIndex === -1) {
      const relatedItems = menuItems.filter(relItem => relItem.group === item.group);
      // Determine groupType from the first item (assume consistency)
      const groupType = relatedItems[0]?.groupType || 'collapsible'; // Default to collapsible

      // Only group if more than one item OR if it's a labelled group (labels make sense even for one item)
      if (relatedItems.length > 1 || groupType === 'labelled') {
         acc.push({
          isGroup: true,
          key: item.group,
          label: item.groupLabel || item.group,
          icon: item.groupIcon, // Icon might only be used by collapsible
          groupType: groupType, // Store the type
          items: [item] // Start with the current item
        });
      } else {
        // Single item, not labelled type -> treat as non-grouped
        acc.push(item);
      }
    } else {
      // Add item to existing group
      acc[existingGroupIndex].items.push(item);
      // Optional: Could add a check here to ensure groupType consistency if needed
    }
    return acc;
  }, []);

  const renderSidebarItem = (item, collapsed, isGroupItem = false) => (
    <SidebarRow
      key={item.key}
      active={!isGroupItem && activeTab === item.key} // Only non-group items can be active
      onClick={() => handleMenuItemClick(item.key)}
      collapsed={collapsed}
      isGroup={false} // Mark as not a group header
    >
      <div className="row-content">
        {item.icon && <div className="row-icon">{item.icon}</div>}
        <span className="row-label">{item.label}</span>
      </div>
    </SidebarRow>
  );

  const renderGroup = (group, collapsed) => {
    const isOpen = openGroups[group.key];

    return (
      <MenuGroupContainer key={group.key}>
        <SidebarRow
          onClick={(e) => toggleGroup(group.key, e)}
          isOpen={isOpen}
          collapsed={collapsed}
          isGroup={true} // Mark as a group header
          active={false} // Group headers cannot be active themselves
        >
          <div className="row-content">
            {/* Collapsible groups can still show an icon in the header */}
            {group.icon && <div className="row-icon">{group.icon}</div>}
            <span className="row-label">{group.label}</span>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="row-arrow"
          />
        </SidebarRow>
        <MenuGroupItems isOpen={isOpen} collapsed={collapsed}>
          {group.items.map(item => renderSidebarItem(item, collapsed, true))}
        </MenuGroupItems>
      </MenuGroupContainer>
    );
  };

  const renderMobileMenuItem = (item) => (
    <MobileMenuItem
      key={item.key}
      active={activeTab === item.key}
      onClick={() => handleMenuItemClick(item.key)}
    >
      <span className="menu-icon">{item.icon}</span>
      <span className="menu-label">{item.label}</span>
    </MobileMenuItem>
  );

  const renderMobileGroup = (group) => {
    const isOpen = openGroups[group.key];

    return (
      <MobileMenuGroup key={group.key}>
        <MobileMenuGroupHeader
          onClick={(e) => toggleGroup(group.key, e)}
          isOpen={isOpen}
        >
          <div className="group-title">
            {group.icon && <span className="group-icon">{group.icon}</span>}
            <span>{group.label}</span>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="group-arrow"
          />
        </MobileMenuGroupHeader>
        <MobileMenuGroupItems isOpen={isOpen}>
          {group.items.map(renderMobileMenuItem)}
        </MobileMenuGroupItems>
      </MobileMenuGroup>
    );
  };

  return (
    <AppLayout>
      {header}

      <MainLayout>
        <Sidebar collapsed={isCollapsed}>
          <CollapseButton
            collapsed={isCollapsed}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <FontAwesomeIcon
              icon={isCollapsed ? faAngleRight : faAngleLeft}
            />
          </CollapseButton>

          {title && <SidebarTitle collapsed={isCollapsed}>{title}</SidebarTitle>}


          {/* Updated Main rendering loop */}
          {groupedMenuItems.map((item, index) => {
            if (item.isGroup) {
              // Check the groupType
              if (item.groupType === 'labelled') {
                // Render Labelled Group
                return (
                  // Use Fragment to group label and items without extra div
                  <Fragment key={item.key}>
                    <GroupLabel collapsed={isCollapsed} >
                      {item.label}
                    </GroupLabel>
                    {item.items.map(subItem => renderSidebarItem(subItem, isCollapsed, true))}
                  </Fragment>
                );
              } else {
                // Render Collapsible Group (default)
                return renderGroup(item, isCollapsed);
              }
            } else {
              // Render Non-Grouped Item
              return renderSidebarItem(item, isCollapsed);
            }
          })}
        </Sidebar>

        <PageContainer>
          {/* Mobile rendering section */}
          <MobileWrapper>
            <MobileSelector>
              <MobileButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <span>{menuItems.find(item => item.key === activeTab)?.label}</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  style={{
                    transform: `rotate(${isMenuOpen ? '90deg' : '0deg'})`,
                    transition: 'transform 0.3s ease',
                    color: '#444'
                  }}
                />
              </MobileButton>
              <Backdrop isOpen={isMenuOpen} onClick={() => setIsMenuOpen(false)} />
              <MobileMenu isOpen={isMenuOpen}>
                <MobileMenuContent>
                  {title && (
                    <MobileMenuTitle>{title}</MobileMenuTitle>
                  )}
                  {/* Mobile view currently doesn't differentiate group types */}
                  {groupedMenuItems.map(item =>
                    item.isGroup
                      ? renderMobileGroup(item)
                      : renderMobileMenuItem(item)
                  )}
                </MobileMenuContent>
              </MobileMenu>
            </MobileSelector>
          </MobileWrapper>

          <ContentWrapper>
            <Content>
              {children}
            </Content>
          </ContentWrapper>
        </PageContainer>
      </MainLayout>
    </AppLayout>
  );
}

const MobileMenuTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #444;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
`;
