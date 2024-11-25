
import React from 'react'
import { Button } from '../../../system/Button/Button'
import styled from 'styled-components'
import ROUTES_NAME from '../../../../../routes/routesName'
import { icons } from '../../../../../constants/icons/icons'
import { useMatch } from 'react-router-dom'
import { useCategoryState } from '../../../../../Context/CategoryContext/CategoryContext'

export const ProductCategoriesToolbar = ({ side = 'left' }) => {

    const { configureAddProductCategoryModal } = useCategoryState();

    const { CATEGORIES } = ROUTES_NAME.INVENTORY_TERM

    const matchWithProductCategories = useMatch(CATEGORIES)

    return (
        matchWithProductCategories && (
            <Container>
                {
                    side === 'right' && (
                        <Group >
                            <Button
                                title='Categoría'
                                startIcon={icons.operationModes.add}
                                onClick={configureAddProductCategoryModal}
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