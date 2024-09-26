
import React from 'react'
import { Button } from '../../../system/Button/Button'
import styled from 'styled-components'
import ROUTES_NAME from '../../../../../routes/routesName'
import { icons } from '../../../../../constants/icons/icons'
import { useMatch, useNavigate } from 'react-router-dom'

export const PreorderMenuToolbar = ({ side = 'left',}) => {
    const navigate = useNavigate();
    const { PREORDERS, BILLS, SALES } = ROUTES_NAME.SALES_TERM
  
    const matchWithProductCategories = useMatch(PREORDERS)
    const handleGoToInvoice = () => navigate(BILLS);
    const handleGoToSales = () => navigate(SALES);
    return (
        matchWithProductCategories && (
            <Container>
                {
                    side === 'right' && (
                        <Group >
                            <Button
                                title='Ventas'
                                endIcon={icons.arrows.chevronRight}
                                onClick={handleGoToSales}
                            />
                             <Button
                                title='Facturas'
                                endIcon={icons.arrows.chevronRight}
                                onClick={handleGoToInvoice}
                            />
                        </Group>
                    )
                }
            </Container>
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