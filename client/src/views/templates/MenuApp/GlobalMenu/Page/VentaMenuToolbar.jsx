import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompress, faExpand, faHeading, faImage, faListAlt } from '@fortawesome/free-solid-svg-icons'
import { handleImageHidden, handleRowMode, selectCategoryGrouped, selectFullScreen, selectImageHidden, selectIsRow, toggleCategoryGrouped, toggleFullScreen } from '../../../../../features/setting/settingSlice'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import ROUTES_NAME from '../../../../../routes/routesName'
import { icons } from '../../../../../constants/icons/icons'
import { useMatch, useNavigate } from 'react-router-dom'
import { InventoryFilterAndSort } from '../../../../pages/Inventario/pages/ItemsManager/components/InvetoryFilterAndSort/InventoryFilterAndSort'
import { toggleTheme } from '../../../../../features/theme/themeSlice'
import { ButtonIconMenu } from '../../../system/Button/ButtonIconMenu'

export const VentaMenuToolbar = ({ side = 'left' }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const ImageHidden = useSelector(selectImageHidden)
    const viewRowModeRef = useSelector(selectIsRow)
    const categoryGrouped = useSelector(selectCategoryGrouped)
    const FullScreen = useSelector(selectFullScreen)
    const { SALES, } = ROUTES_NAME.SALES_TERM
    const { SETTING } = ROUTES_NAME.SETTING_TERM
    const matchWithVenta = useMatch(SALES)


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
    const handleSettings = () => {
        navigate(SETTING)
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
                            <ButtonIconMenu 
                                tooltipDescription={FullScreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
                                tooltipPlacement={'bottom-end'}
                                icon={FullScreen ?  <FontAwesomeIcon icon={faCompress} /> : <FontAwesomeIcon icon={faExpand} /> }
                                onClick={() => handleFullScreenFN()}
                            />
                            <InventoryFilterAndSort />
                            <ButtonIconMenu 
                                icon={icons.operationModes.setting}
                                onClick={() => handleSettings()}
                            />
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