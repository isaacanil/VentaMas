import React from 'react'
import { Input } from '../system/Inputs/InputV2'
import { SearchClient } from '../system/Inputs/SearchClient'

export const SearchProductBar = ({ searchData, setSearchData }) => {
    const handleClearInput = () => setSearchData('');
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
        onChange={(e) => setSearchData(e.target.value)}
      />
    )
}
