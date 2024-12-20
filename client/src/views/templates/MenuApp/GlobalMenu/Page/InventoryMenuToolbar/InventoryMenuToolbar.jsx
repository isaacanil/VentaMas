import React, { Fragment, useState } from 'react'
import styled from 'styled-components'
import { useMatch, useNavigate } from 'react-router-dom'
import { AddProductButton } from '../../../../system/Button/AddProductButton'
import { ExportProductsButton } from '../../../../system/Button/ExportProductsButton'
import { Button, ButtonGroup } from '../../../../system/Button/Button'
import ROUTES_NAME from '../../../../../../routes/routesName'
import { useDispatch, useSelector } from 'react-redux'
import { InventoryFilterAndSort } from '../../../../../pages/Inventario/pages/ItemsManager/components/InvetoryFilterAndSort/InventoryFilterAndSort'
import { ImportProductsButton } from './components/ImportProductsButton'
import { DropdownMenu } from '../../../../system/DropdownMenu/DropdowMenu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExcel, faFileExport, faFileImport, faHeading, faImage, faListAlt } from '@fortawesome/free-solid-svg-icons'
import { icons } from '../../../../../../constants/icons/icons'
import ImportModal from '../../../../../component/modals/ImportModal/ImportModal'
import { createProductTemplate, importProductData } from '../../../../../../utils/import/product'
import * as antd from 'antd'
import { fbAddProducts } from '../../../../../../firebase/products/fbAddProducts'
import { selectUser } from '../../../../../../features/auth/userSlice'
import { getProducts } from '../../../../../../utils/pricing'
import { useGetProducts } from '../../../../../../firebase/products/fbGetProducts'
import { ExportProducts } from '../../../../../../hooks/exportToExcel/useExportProducts'
import { selectTaxReceiptEnabled } from '../../../../../../features/taxReceipt/taxReceiptSlice'
const { message } = antd

export const InventoryMenuToolbar = ({ side = 'left' }) => {
    const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM
    const matchWithInventory = useMatch(INVENTORY_ITEMS)

    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
    const { products } = useGetProducts();
    const user = useSelector(selectUser);

    const handleImport = async (file) => {
        try {
            const productData = await importProductData(file, 'es');
            await fbAddProducts(user, productData);
            message.success('Archivo importado correctamente.');
        } catch (error) {
            message.error('Hubo un problema al importar el archivo.');
        }
    };

    const handleCreateTemplate = async () => {
        try {
            await createProductTemplate('es');
        } catch (error) {
            console.error('Error al crear la plantilla:', error);
            message.error('Hubo un problema al crear la plantilla.');
        }
    }

    const handleExport = () => {
        // Definir las opciones de impuestos
        const tax = {
            0: 'Exento',
            16: '16%',
            18: '18%',
        };

        // Obtener los productos transformados
        const productsArray = getProducts(products, taxReceiptEnabled);
        const productsTaxTransformed = productsArray.map(product => ({
            ...product,
            pricing: {
                ...product.pricing,
                tax: taxReceiptEnabled 
                    ? (product.pricing.tax ? tax[product.pricing.tax] : 'Exento') 
                    : 'Exento',
            }
        }));

        // Ejecutar la exportación
        ExportProducts(productsTaxTransformed);
    };
    const options = [
        {
            text: 'Importar Productos',
            description: 'Productos en lista.',
            icon: <FontAwesomeIcon icon={faFileImport} />,
            action: () => setImportDialogOpen(true),
            closeWhenAction: true
        },
        {
            text: 'Exportar Productos',
            description: 'Exporta productos a un archivo Excel.',
            icon: <FontAwesomeIcon icon={faFileExport} />,
            action: handleExport,
            closeWhenAction: true
        },
    ];
    return (
        matchWithInventory && (
            <Container>
                {side === 'right' && (
                    <Fragment>
                        <ButtonGroup>
                            <DropdownMenu
                                title={"Herramientas"}
                                options={options}
                                borderRadius='normal'
                            />
                            {/* <ImportProductsButton /> */}
                            {/* <ExportProductsButton /> */}
                            <AddProductButton />
                            <InventoryFilterAndSort />
                        </ButtonGroup>
                        <ImportModal
                            open={importDialogOpen}
                            onClose={() => setImportDialogOpen(false)}
                            onImport={handleImport}
                            onCreateTemplate={handleCreateTemplate}
                        />
                    </Fragment>
                )}
            </Container>
        )
    )
}
const Container = styled.div`

  
`