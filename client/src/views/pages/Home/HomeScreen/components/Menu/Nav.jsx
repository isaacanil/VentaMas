import React, { useState } from 'react';
import styled from 'styled-components';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { SidebarItem } from './SidebarItem';
export const Sidebar = ({ items }) => {
    const [isCompact, setIsCompact] = useState(false);
    const [activeMenuIndex, setActiveMenuIndex] = useState(null);

    const handleMenuItemClick = (index) => {
        if (activeMenuIndex === index) {
            setActiveMenuIndex(null);
        } else {
            setActiveMenuIndex(index);
        }
    };

    return (
        <SidebarContainer isCompact={isCompact}>
            <SidebarMenu>
                {items && items.map((item, index) => (
                    <SidebarItem item={item}/>
                   
                    ))}
            </SidebarMenu>
        </SidebarContainer>
    )
};

const SidebarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 8em;
  background-color: #fff;
  border-right: 1px solid #e5e5e5;
  transition: width 0.2s ease-in-out;
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e5e5;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  cursor: pointer;

  &:hover {
    background-color: #f7f7f7;
  }
`;

const SidebarMenu = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
 
  gap: 1em;
`;



const SidebarMenuItemLabel = styled.span`
  margin-left: 16px;
`;
