import React, { useState } from 'react';
import styled from 'styled-components';

interface TabItem {
  title: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  tabPosition?: 'top' | 'bottom' | 'left' | 'right';
}

interface TabsContainerProps {
  $tabPosition: 'top' | 'bottom' | 'left' | 'right';
}

interface TabListProps {
  $tabPosition: 'top' | 'bottom' | 'left' | 'right';
}

interface TabProps {
  $active: boolean;
}


const TabsContainer = styled.div<TabsContainerProps>`
  display: grid;
  /* stylelint-disable declaration-block-no-redundant-longhand-properties -- dynamic grid layout is clearer when rows, columns, and areas are handled independently */
  grid-template-areas: ${(props: TabsContainerProps) => {
    switch (props.$tabPosition) {
      case 'bottom':
        return '"content" "tabs"';
      case 'left':
        return '"tabs content"';
      case 'right':
        return '"content tabs"';
      default:
        return '"tabs" "content"';
    }
  }};
  grid-template-rows: ${(props: TabsContainerProps) =>
    props.$tabPosition === 'top' || props.$tabPosition === 'bottom'
      ? 'min-content 1fr'
      : '1fr'};
  grid-template-columns: ${(props: TabsContainerProps) => {
    switch (props.$tabPosition) {
      case 'left':
        return '250px 1fr'; // Ajusta '250px' al ancho deseado para 'left'
      case 'right':
        return '1fr 250px'; // Ajusta '250px' al ancho deseado para 'right'
      default:
        return '1fr';
    }
  }};
  /* stylelint-enable declaration-block-no-redundant-longhand-properties */
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const TabList = styled.ul<TabListProps>`
  display: flex;
  flex-direction: ${(props: TabListProps) =>
    props.$tabPosition === 'left' || props.$tabPosition === 'right'
      ? 'column'
      : 'row'};
  grid-area: tabs;
  padding: 0;
  list-style-type: none;
  background-color: #f8f9fa;
`;

const Tab = styled.li<TabProps>`
  padding: 10px 20px;
  color: ${(props: TabProps) => (props.$active ? '#fff' : '#000')};
  white-space: nowrap;
  cursor: pointer;
  background-color: ${(props: TabProps) => (props.$active ? '#4caf50' : '#f8f9fa')};

  &:hover {
    background-color: ${(props: TabProps) => (props.$active ? '#4caf50' : '#e9ecef')};
  }
`;

const TabContent = styled.div`
  grid-area: content;
  padding: 10px;
  overflow: auto;
  background-color: #fdfdfd;
  border-top: none;
`;

const Tabs = ({ tabs, tabPosition = 'top' }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <TabsContainer $tabPosition={tabPosition}>
      <TabList $tabPosition={tabPosition}>
        {tabs.map((tab: TabItem, index: number) => (
          <Tab
            key={index}
            $active={activeTab === index}
            onClick={() => setActiveTab(index)}
          >
            {tab.title}
          </Tab>
        ))}
      </TabList>
      <TabContent>{tabs[activeTab].content}</TabContent>
    </TabsContainer>
  );
};

export default Tabs;
