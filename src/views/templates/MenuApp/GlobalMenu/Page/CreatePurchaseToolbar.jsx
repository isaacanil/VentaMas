import React from 'react'
import { useMatch } from 'react-router-dom'
import styled from 'styled-components'

import routesName from '../../../../../routes/routesName'
import { AddProductButton } from '../../../system/Button/AddProductButton'
import { ButtonGroup } from '../../../system/Button/Button'

export const CreatePurchaseToolbar = ({ side = 'left' }) => {
    const {  PURCHASES_CREATE  } = routesName.PURCHASE_TERM;
    const matchWithCashReconciliation = useMatch(PURCHASES_CREATE)
    return (
        matchWithCashReconciliation ? (
            <Container>
                {
                    side === 'right' && (
                        <ButtonGroup>
                            
                               <AddProductButton />
                        </ButtonGroup>
                    )
                }
            </Container>
        ) : null
    )
}

const Container = styled.div`

`
