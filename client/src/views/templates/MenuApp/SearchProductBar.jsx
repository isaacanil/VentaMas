import React from 'react'
import { Input } from '../system/Inputs/InputV2'

export const SearchProductBar = ({ searchData, setSearchData }) => {
    return (
        <Input
            title='Buscar Producto'
            type='search'
            size='small'
            onChange={(e) => (
                setSearchData(e.target.value)
            )}
        />
    )
}
