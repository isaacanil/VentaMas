import React, { Fragment, useState } from 'react'
import { Button } from '../../../system/Button/Button'
import styled from 'styled-components'
import ROUTES_NAME from '../../../../../routes/routesName'
import { useMatch } from 'react-router-dom'
import { icons } from '../../../../../constants/icons/icons'
import { WarehouseForm } from '../../../../pages/Inventory/components/Warehouse/forms/WarehouseForm/WarehouseForm'

export const WarehouseToolbar = ({ side = 'left' }) => {
    const [isOpen, setIsOpen] = useState(false)
    const { WAREHOUSES } = ROUTES_NAME.INVENTORY_TERM
    const matchWithWarehouses = useMatch(WAREHOUSES)
    return (
        matchWithWarehouses && (
            <Fragment>
                <Container>
                    {
                        side === 'right' && (
                            <Group >
                                <Button
                                    tooltipDescription={'Agregar almacén'}
                                    tooltipPlacement={'bottom-end'}
                                    startIcon={icons.operationModes.add}
                                    borderRadius='normal'
                                    title={'Almacén'}
                                    onClick={() => setIsOpen(true)}
                                />

                            </Group>
                        )
                    }
                </Container>
                {isOpen && (
                    <WarehouseForm
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        
                    />
                )}
            </Fragment>
        )
    )
}
const Container = styled.div`

`
const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4em;
 
`