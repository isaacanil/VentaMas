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
            $active={activeTab === index}
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
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const TabsList = styled.div`
  display: flex;
  flex-shrink: 0; /* No permite que se reduzca */
  background: #2a2a2a;
  border-bottom: 1px solid #333;
`;

const TabButton = styled.button`
  padding: 12px 16px;
  font-size: 13px;
  color: ${(props) => (props.$active ? '#00ff88' : '#999')};
  cursor: pointer;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? '#00ff88' : 'transparent')};

  &:hover {
    color: ${(props) => (props.$active ? '#00ff88' : '#fff')};
  }
`;

const TabContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: #1a1a1a;
`;
