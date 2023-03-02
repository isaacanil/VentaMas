import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleMode } from '../../../features/appModes/appModeSlice';
import { Input } from '../system/Inputs/InputV2'
import { SearchClient } from '../system/Inputs/SearchClient'

export const SearchProductBar = ({ searchData, setSearchData }) => {
    const handleClearInput = () => {setSearchData('')};
    const navigate = useNavigate()
    const dispatch = useDispatch()
    useEffect(()=>{
      switch(searchData){
        case '$activeDevMode':
          dispatch(toggleMode())
          setSearchData('')
          break;
        case '$openClientList':
          navigate('/devTools')
          setSearchData('')
          break;
        case '$goToFreeSpace':
          navigate('/app/freeSpace')
          setSearchData('')
          break;
        default:  
          break;
      }
    }, [searchData])
    return (
        // <Input
        //     title='Buscar Producto'
        //     type='search'
        //     size='small'
        //     onChange={(e) => (
        //         setSearchData(e.target.value)
        //     )}
        // />
        <SearchClient
        //name='name'
        //onFocus={OpenClientList}
        title={searchData}
        label={'Buscar Producto'}
        fn={handleClearInput}
        onChange={(e) =>  setSearchData(e.target.value)
        }
      />
    )
}
