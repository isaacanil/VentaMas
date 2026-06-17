import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { toggleMode } from '@/features/appModes/appModeSlice';

interface SearchProductBarProps {
  searchData: string;
  setSearchData: (value: string) => void;
}

export const SearchProductBar = ({
  searchData,
  setSearchData,
}: SearchProductBarProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSearchChange = (value: string) => {
    setSearchData(value);

    switch (value) {
      case '$activeDevMode':
        dispatch(toggleMode());
        setSearchData('');
        break;
      case '$openClientList':
        navigate('/devTools');
        setSearchData('');
        break;
      case '$goToFreeSpace':
        navigate('/app/freeSpace');
        setSearchData('');
        break;
      default:
        break;
    }
  };
  return (
    <div>
      <input
        type="search"
        placeholder="Buscar Producto"
        value={searchData}
        onChange={(e) => handleSearchChange(e.target.value)}
      />
    </div>
  );
};
