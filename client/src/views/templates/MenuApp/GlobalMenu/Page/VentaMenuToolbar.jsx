
import React from 'react'
import { Button } from '../../../system/Button/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompress, faExpand, faGrip, faGripLines, faHeading, faImage, faListAlt } from '@fortawesome/free-solid-svg-icons'
import { handleImageHidden, handleRowMode, selectCategoryGrouped, selectFullScreen, selectImageHidden, selectIsRow, toggleCategoryGrouped, toggleFullScreen } from '../../../../../features/setting/settingSlice'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import ROUTES_NAME from '../../../../../routes/routesName'
import { useMatch } from 'react-router-dom'
import { InventoryFilterAndSort } from '../../../../pages/Inventario/pages/ItemsManager/components/InvetoryFilterAndSort/InventoryFilterAndSort'
import { setTheme, toggleTheme } from '../../../../../features/theme/themeSlice'
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

        // user?.role === 'dev' ?
        //     {
        //         text: savedTheme ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro',
        //         description: savedTheme ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro',
        //         icon: <FontAwesomeIcon icon={faImage} />,
        //         action: () => handleThemeModeFN()
        //     } : null
    ];

    return (
        matchWithVenta && (
            <Container>
            
                {
                    side === 'right' && (
                        <Group >
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
                            {/* <DropdownMenu
                                title={icons.operationModes.setting}
                                options={options}
                                width={'icon32'}
                                borderRadius='normal'
                                
                            /> */}
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