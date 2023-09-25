
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
import { fbAddCategory } from '../../../../../firebase/categories/fbAddCategory'
import { useCategoryState } from '../../../../../Context/CategoryContext/CategoryContext'

export const ProductCategoriesToolbar = ({ side = 'left', searchData, setSearchData }) => {

    const dispatch = useDispatch()

    const { configureAddProductCategoryModal } = useCategoryState();

    const { CATEGORIES } = ROUTES_NAME.INVENTORY_TERM

    const matchWithProductCategories = useMatch(CATEGORIES)

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