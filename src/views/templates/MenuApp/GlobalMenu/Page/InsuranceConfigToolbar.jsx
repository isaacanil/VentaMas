import React, { Fragment, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useMatch } from 'react-router-dom'
import styled from 'styled-components'

import { icons } from '../../../../../constants/icons/icons'
import { openInsuranceConfigModal } from '../../../../../features/insurance/insuranceConfigModalSlice'
import ROUTES_NAME from '../../../../../routes/routesName'
import { Button } from '../../../system/Button/Button'

export const InsuranceConfigToolbar = ({ side = 'left' }) => {
    const [isOpen, setIsOpen] = useState(false)
    const dispatch = useDispatch()
    const { pathname } = useLocation();
    const { INSURANCE_CREATE, INSURANCE_CONFIG } = ROUTES_NAME.INSURANCE_TERM
    const matchInsuranceConfig = useMatch(INSURANCE_CONFIG)

    const handleCreateNew = () => {
        dispatch(openInsuranceConfigModal(null));
    };

    return (
        matchInsuranceConfig && (
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
                                    title={'Seguro'}
                                    onClick={handleCreateNew}
                                />

                            </Group>
                        )
                    }
                </Container>
                {/* {isOpen && (
                    <WarehouseForm
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        
                    />
                )} */}
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