import { SearchOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { Input, Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const TreeHeader = ({ searchTerm, setSearchTerm, allExpanded, handleToggleAll }) => (
  <HeaderContainer>
    <Input
      placeholder="Buscar por nombre o producto..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      prefix={<SearchOutlined />}
      style={{ marginRight: "10px", flex: 1 }}
    />
    <Button
      onClick={handleToggleAll}
      icon={allExpanded ? <UpOutlined /> : <DownOutlined />}
      type="text"
    />
  </HeaderContainer>
);

export default TreeHeader;