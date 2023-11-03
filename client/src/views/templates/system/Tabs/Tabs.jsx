import React, { useState } from 'react';
import styled from 'styled-components';

const TabsContainer = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  overflow: hidden;
  grid-template-areas: ${props => {
    switch (props.tabPosition) {
      case 'bottom': return '"content" "tabs"';
      case 'left': return '"tabs content"';
      case 'right': return '"content tabs"';
      default: return '"tabs" "content"';
    }
  }};
   grid-template-columns: ${props => {
    switch (props.tabPosition) {
      case 'left': return '250px 1fr';  // Ajusta '250px' al ancho deseado para 'left'
      case 'right': return '1fr 250px'; // Ajusta '250px' al ancho deseado para 'right'
      default: return '1fr';
    }
  }};

  grid-template-rows: ${props => (props.tabPosition === 'top' || props.tabPosition === 'bottom') ? 'min-content 1fr' : '1fr'};
`;

const TabList = styled.ul`
  list-style-type: none;
  padding: 0;
  background-color:  #f8f9fa;
  display: flex;
  grid-area: tabs;
  flex-direction: ${props => (props.tabPosition === 'left' || props.tabPosition === 'right') ? 'column' : 'row'};
`;

const Tab = styled.li`
  padding: 10px 20px;
  cursor: pointer;
  white-space: nowrap;
  background-color: ${props => (props.active ? '#4caf50' : '#f8f9fa')};
  color: ${props => (props.active ? '#fff' : '#000')};
 
  &:hover {
    background-color: ${props => (props.active ? '#4caf50' : '#e9ecef')};
  }
`;

const TabContent = styled.div`
  padding: 10px;
  border-top: none;
  grid-area: content;
  overflow: auto;
  background-color: #fdfdfd;
`;

const Tabs = ({ tabs, tabPosition = 'top' }) => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <TabsContainer tabPosition={tabPosition}>
      <TabList tabPosition={tabPosition}>
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            active={activeTab === index}
            onClick={() => setActiveTab(index)}
          >
            {tab.title}
          </Tab>
        ))}
      </TabList>
      <TabContent>
        {tabs[activeTab].content}
      </TabContent>
    </TabsContainer>
  );
};

export default Tabs;
