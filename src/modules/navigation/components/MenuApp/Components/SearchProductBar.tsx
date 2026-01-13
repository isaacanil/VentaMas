import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { toggleMode } from '@/features/appModes/appModeSlice';
// import { SearchClient } from '@/components/ui/Inputs/SearchClient' // TODO: Component not found

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
  useEffect(() => {
    switch (searchData) {
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
  }, [searchData, dispatch, navigate, setSearchData]);
  return (
    <div>
      {/* TODO: SearchClient component not found */}
      <input
        type="search"
        placeholder="Buscar Producto"
        value={searchData}
        onChange={(e) => setSearchData(e.target.value)}
      />
    </div>
    // <SearchClient
    // title={searchData}
    // label={'Buscar Producto'}
    // fn={handleClearInput}
    // onChange={(e) =>  setSearchData(e.target.value)
    // }
    // />
  );
};
