
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
import { InventoryFilterAndSort } from '../../../../pages/Inventario/pages/ItemsManager/components/InvetoryFilterAndSort/InventoryFilterAndSort'
import { DropdownMenu } from '../../../system/DropdownMenu/DropdowMenu'
import { setTheme, toggleTheme } from '../../../../../features/theme/themeSlice'
import { fbAAddMultipleClients } from '../../../../../firebase/client/fbAddMultipleClients'
import { clients } from '../../../../../firebase/client/clients'
import { selectUser } from '../../../../../features/auth/userSlice'
export const VentaMenuToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const ImageHidden = useSelector(selectImageHidden)
    const viewRowModeRef = useSelector(selectIsRow)
    const categoryGrouped = useSelector(selectCategoryGrouped)
    const FullScreen = useSelector(selectFullScreen)
    const { SALES } = ROUTES_NAME.SALES_TERM
    const matchWithVenta = useMatch(SALES)
    const user = useSelector(selectUser)
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
    const savedTheme = localStorage.getItem('theme');
    const handleThemeModeFN = () => {

        dispatch(toggleTheme());


    }

    const options = [
        {
            text: categoryGrouped ? 'Desagrupar Productos' : 'Agrupar por Categoría',
            description: categoryGrouped ? 'Productos en lista individual.' : 'Productos agrupados por categoría.',
            icon: <FontAwesomeIcon icon={faHeading} />,
            action: () => handleCategoryGroupedFN()
        },
        {
            text: viewRowModeRef ? 'Vista Compacta' : 'Vista Detallada',
            description: viewRowModeRef ? 'Productos en tarjetas.' : 'Productos en lista.',
            icon: <FontAwesomeIcon icon={faListAlt} />,
            action: () => handleRowModeFN()
        },
        {
            text: ImageHidden ? 'Mostrar Imágenes' : 'Ocultar Imágenes',
            description: ImageHidden ? 'Ver imágenes de productos.' : 'Ocultar imágenes de productos.',
            icon: <FontAwesomeIcon icon={faImage} />,
            action: () => handleImageHiddenFN()
        },
        user?.role === 'dev' ?
            {
                text: savedTheme ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro',
                description: savedTheme ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro',
                icon: <FontAwesomeIcon icon={faImage} />,
                action: () => handleThemeModeFN()
            } : null

    ];

    return (
        matchWithVenta && (
            <Container>
                {
                    side === 'left' && (


                        <SearchInput
                            search
                            deleteBtn
                            icon={icons.operationModes.search}
                            placeholder='Buscar Producto...'
                            bgColor={'white'}
                            value={searchData}
                            onClear={() => setSearchData('')}
                            onChange={(e) => setSearchData(e.target.value)}
                        />
                    )

                }
                {
                    side === 'right' && (
                        <Group >

                            {/* <Button
                                tooltipDescription={'Cambiar vista 8'}
                                tooltipPlacement={'bottom'}
                                width={'icon32'}
                                borderRadius='normal'
                                iconOff={<FontAwesomeIcon icon={faHeading} />}
                                iconOn={<FontAwesomeIcon icon={faHeading} />}
                                isActivated={categoryGrouped ? true : false}
                                isActivatedColors='style1'
                                onClick={() => handleCategoryGroupedFN()}
                            /> */}
                            {/* <Button
                                tooltipDescription={'Cambiar vista'}
                                tooltipPlacement={'bottom'}
                                width={'icon32'}
                                borderRadius='normal'
                                iconOff={<FontAwesomeIcon icon={faGrip} />}
                                iconOn={<FontAwesomeIcon icon={faGripLines} />}
                                isActivated={viewRowModeRef ? true : false}
                                isActivatedColors='style1'
                                onClick={() => handleRowModeFN()}
                            /> */}
                            {/* <Button
                                tooltipDescription={ImageHidden ? 'Mostrar Imagen' : 'Ocultar Imagen'}
                                tooltipPlacement={'bottom-end'}
                                width={'icon32'}
                                borderRadius='normal'
                                isActivated={ImageHidden ? true : false}
                                isActivatedColors='style1'
                                iconOff={<FontAwesomeIcon icon={faImage} />}
                                iconOn={<FontAwesomeIcon icon={faImage} />}
                                onClick={() => handleImageHiddenFN()}
                            /> */}
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
                            <InventoryFilterAndSort />
                            <DropdownMenu
                                title={icons.operationModes.setting}
                                options={options}
                                width={'icon32'}
                                borderRadius='normal'
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