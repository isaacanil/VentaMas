import React, { Fragment } from 'react'
import styled from 'styled-components'
import { useMatch } from 'react-router-dom'
import { SearchInput } from '../../../system/Inputs/SearchInput'
import { FaSearch } from 'react-icons/fa'
import { AddProductButton } from '../../../system/Button/AddProductButton'
import { ExportProductsButton } from '../../../system/Button/ExportProductsButton'
import { ButtonGroup } from '../../../system/Button/Button'
import findRouteByName from '../../findRouteByName'
import ROUTES_NAME from '../../../../../routes/routesName'
import { useMatchRouteByName } from '../useMatchRouterByName'

export const InventoryMenuToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM
    const matchWithInventory = useMatch('/inventory/items')
    return (
        matchWithInventory && (
            <Container>
                {side === 'left' && (
                    <SearchInput
                        deleteBtn
                        icon={<FaSearch />}
                        placeholder='Buscar ...'
                        bgColor={'white'}
                        value={searchData}
                        onChange={(e) => setSearchData(e.target.value)}
                    />
                )}
                {side === 'right' && (

                    <Fragment>
                        <ButtonGroup>
                            <ExportProductsButton />
                            <AddProductButton />
                        </ButtonGroup>
                    </Fragment>
                )}
            </Container>
        )
    )
}
const Container = styled.div`

  
`