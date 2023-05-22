
import React from 'react'
import { useMatch } from 'react-router-dom'
import { Button } from '../../../system/Button/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompress, faExpand, faGrip, faGripLines, faHeading, faImage } from '@fortawesome/free-solid-svg-icons'
import { handleImageHidden, handleRowMode, selectCategoryGrouped, selectFullScreen, selectImageHidden, selectIsRow, toggleCategoryGrouped, toggleFullScreen } from '../../../../../features/setting/settingSlice'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { SearchInput } from '../../../system/Inputs/SearchInput'
import { FaSearch } from 'react-icons/fa'
import { Tooltip } from '../../../system/Button/Tooltip'
import { useMatchRouteByName } from '../useMatchRouterByName'
import ROUTES_NAME from '../../../../../routes/routesName'

export const VentaMenuToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const ImageHidden = useSelector(selectImageHidden)
    const viewRowModeRef = useSelector(selectIsRow)
    const categoryGrouped = useSelector(selectCategoryGrouped)
    const FullScreen = useSelector(selectFullScreen)
    const {SALES} = ROUTES_NAME.SALES_TERM
    const matchWithVenta = useMatchRouteByName(SALES)
    const dispatch = useDispatch()
    const handleImageHiddenFN = () => {
        dispatch(handleImageHidden())
    }
    const handleFullScreenFN = () => {
        dispatch(toggleFullScreen())
    }
    const handleRowModeFN = () => {
        dispatch(handleRowMode())
    }
    const handleCategoryGroupedFN = () => {
        dispatch(toggleCategoryGrouped())
    }
    return (
        matchWithVenta && (
            <Container>
                {
                    side === 'left' && (

                        matchWithVenta && (
                            <SearchInput
                                search
                                deleteBtn
                                icon={<FaSearch />}
                                placeholder='Buscar Producto...'
                                bgColor={'white'}
                                value={searchData}
                                onClear={() => setSearchData('')}
                                onChange={(e) => setSearchData(e.target.value)}
                            />
                        )
                    )
                }
                {
                    side === 'right' && (
                        <Group >
                            <Button
                                tooltipDescription={'Cambiar vista 8'}
                                tooltipPlacement={'bottom'}
                                width={'icon32'}
                                borderRadius='normal'
                                iconOff={<FontAwesomeIcon icon={faHeading} />}
                                iconOn={<FontAwesomeIcon icon={faHeading} />}
                                isActivated={categoryGrouped ? true : false}
                                isActivatedColors='style1'
                                onClick={() => handleCategoryGroupedFN()}
                            />
                            <Button
                                tooltipDescription={'Cambiar vista'}
                                tooltipPlacement={'bottom'}
                                width={'icon32'}
                                borderRadius='normal'
                                iconOff={<FontAwesomeIcon icon={faGrip} />}
                                iconOn={<FontAwesomeIcon icon={faGripLines} />}
                                isActivated={viewRowModeRef ? true : false}
                                isActivatedColors='style1'
                                onClick={() => handleRowModeFN()}
                            />
                            <Button
                                tooltipDescription={ImageHidden ? 'Mostrar Imagen' : 'Ocultar Imagen'}
                                tooltipPlacement={'bottom-end'}
                                width={'icon32'}
                                borderRadius='normal'
                                isActivated={ImageHidden ? true : false}
                                isActivatedColors='style1'
                                iconOff={<FontAwesomeIcon icon={faImage} />}
                                iconOn={<FontAwesomeIcon icon={faImage} />}
                                onClick={() => handleImageHiddenFN()}
                            />
                            <Button
                                tooltipDescription={FullScreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
                                tooltipPlacement={'bottom-end'}
                                width={'icon32'}
                                borderRadius='normal'
                                isActivated={FullScreen ? true : false}
                                isActivatedColors='style1'
                                iconOff={<FontAwesomeIcon icon={faCompress} />}
                                iconOn={<FontAwesomeIcon icon={faExpand} />}
                                onClick={() => handleFullScreenFN()}
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