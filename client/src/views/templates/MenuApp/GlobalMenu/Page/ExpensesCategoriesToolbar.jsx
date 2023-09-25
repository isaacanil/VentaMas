
import React from 'react'
import { Button } from '../../../system/Button/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompress, faExpand, faGrip, faGripLines, faHeading, faImage, faListAlt } from '@fortawesome/free-solid-svg-icons'
import { handleImageHidden, handleRowMode, selectCategoryGrouped, selectFullScreen, selectImageHidden, selectIsRow, toggleCategoryGrouped, toggleFullScreen } from '../../../../../features/setting/settingSlice'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { SearchInput } from '../../../system/Inputs/SearchInput'
import { useMatchRouteByName } from '../useMatchRouterByName'
import ROUTES_NAME from '../../../../../routes/routesName'
import { icons } from '../../../../../constants/icons/icons'
import { useMatch } from 'react-router-dom'
import { selectUser } from '../../../../../features/auth/userSlice'
import { toggleAddCategory } from '../../../../../features/modals/modalSlice'
import { useCategoryState } from '../../../../../Context/CategoryContext/CategoryContext'

export const ExpensesCategoriesToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const user = useSelector(selectUser)
    const dispatch = useDispatch()
    const { EXPENSES_CATEGORY } = ROUTES_NAME.EXPENSES_TERM
    const matchWithProductCategories = useMatch(EXPENSES_CATEGORY)
    const { configureAddExpenseCategoryModal } = useCategoryState();
    return (
        matchWithProductCategories && (
            <Container>
                {/* {
                    side === 'left' && (
                        <SearchInput
                            search
                            deleteBtn
                            icon={icons.operationModes.search}
                            placeholder='Buscar Categoría...'
                            bgColor={'white'}
                            value={searchData}
                            onClear={() => setSearchData('')}
                            onChange={(e) => setSearchData(e.target.value)}
                        />
                    )
                } */}
                {
                    side === 'right' && (
                        <Group >
                            <Button
                                title='Categoría'
                                startIcon={icons.operationModes.add}
                                onClick={configureAddExpenseCategoryModal}
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