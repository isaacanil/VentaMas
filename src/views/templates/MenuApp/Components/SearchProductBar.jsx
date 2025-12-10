import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { toggleMode } from '../../../../features/appModes/appModeSlice';
// import { SearchClient } from '../../system/Inputs/SearchClient' // TODO: Component not found

export const SearchProductBar = ({ searchData, setSearchData }) => {
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
