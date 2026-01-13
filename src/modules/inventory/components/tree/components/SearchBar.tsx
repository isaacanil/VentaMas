import { SearchOutlined, UpOutlined, DownOutlined } from '@/constants/icons/antd';
import { Input, Button } from 'antd';
import React from 'react';

type SearchBarProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  allExpanded: boolean;
  handleToggleAll: () => void;
};

const SearchBar = ({
  searchTerm,
  setSearchTerm,
  allExpanded,
  handleToggleAll,
}: SearchBarProps) => {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}
    >
      <Input
        placeholder="Buscar por nombre o producto..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        prefix={<SearchOutlined />}
        style={{ marginRight: '10px', flex: 1 }}
      />
      <Button
        onClick={handleToggleAll}
        icon={allExpanded ? <UpOutlined /> : <DownOutlined />}
        type="text"
      />
    </div>
  );
};

export default SearchBar;
