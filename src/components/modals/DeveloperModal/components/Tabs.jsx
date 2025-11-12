import React, { useState } from 'react';
import styled from 'styled-components';

export const Tabs = ({ tabs, defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContainer>
      <TabsList>
        {tabs.map((tab, index) => (
          <TabButton
            key={index}
            active={activeTab === index}
            onClick={() => setActiveTab(index)}
          >
            {tab.icon} {tab.label}
          </TabButton>
        ))}
      </TabsList>
      <TabContent>{tabs[activeTab]?.content}</TabContent>
    </TabsContainer>
  );
};

const TabsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  flex: 1;
  overflow: hidden;
`;

const TabsList = styled.div`
  display: flex;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
  flex-shrink: 0; /* No permite que se reduzca */
`;

const TabButton = styled.button`
  background: none;
  border: none;
  padding: 12px 16px;
  color: ${(props) => (props.active ? '#00ff88' : '#999')};
  font-size: 13px;
  cursor: pointer;
  border-bottom: 2px solid
    ${(props) => (props.active ? '#00ff88' : 'transparent')};

  &:hover {
    color: ${(props) => (props.active ? '#00ff88' : '#fff')};
  }
`;

const TabContent = styled.div`
  flex: 1;
  background: #1a1a1a;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
