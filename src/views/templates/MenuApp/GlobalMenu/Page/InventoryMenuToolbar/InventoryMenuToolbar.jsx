import {
  faFileExport,
  faFileImport,
  faEllipsisVertical,
  faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { message } from 'antd';
import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '../../../../../../features/auth/userSlice';
import { selectTaxReceiptEnabled } from '../../../../../../features/taxReceipt/taxReceiptSlice';
import { fbAddProducts } from '../../../../../../firebase/products/fbAddProducts';
import { useGetProducts } from '../../../../../../firebase/products/fbGetProducts';
import { normalizeProductTaxes } from '../../../../../../firebase/products/fbNormalizeProductTaxes';
import { ExportProducts } from '../../../../../../hooks/exportToExcel/useExportProducts';
import useViewportWidth from '../../../../../../hooks/windows/useViewportWidth';
import ROUTES_NAME from '../../../../../../routes/routesName';
import {
  createProductTemplate,
  importProductData,
} from '../../../../../../utils/import/product';
import { getProducts } from '../../../../../../utils/pricing';
import ImportModal from '../../../../../component/modals/ImportModal/ImportModal';
import ImportProgressModal from '../../../../../component/modals/ImportProgressModal/ImportProgressModal';
import { InventoryFilterAndSort } from '../../../../../pages/Inventario/pages/ItemsManager/components/InvetoryFilterAndSort/InventoryFilterAndSort';
import { AddProductButton } from '../../../../system/Button/AddProductButton';
import { ButtonGroup } from '../../../../system/Button/Button';
import { DropdownMenu } from '../../../../system/DropdownMenu/DropdowMenu';

import { fbAddActiveIngredients } from './fbAddActiveIngredients';

export const InventoryMenuToolbar = ({ side = 'left' }) => {
  const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM;
  const matchWithInventory = useMatch(INVENTORY_ITEMS);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const { products } = useGetProducts();
  const user = useSelector(selectUser);
  const vw = useViewportWidth();
  const [importProgress, setImportProgress] = useState({
    totalProducts: 0,
    processedProducts: 0,
    updatedProducts: 0,
    newProducts: 0,
    newCategories: 0,
    newIngredients: 0,
    updatedIngredients: 0,
  });
  const [showProgress, setShowProgress] = useState(false);

  const handleImport = async (file, { dryRun = false } = {}) => {
    try {
      const productData = await importProductData(file, 'es');

      if (dryRun) {
        return productData;
      }

      setShowProgress(true);
      await fbAddActiveIngredients(user, productData);
      await fbAddProducts(user, productData, 10000, (progress) => {
        setImportProgress(progress.stats);
      });
      message.success('Archivo importado correctamente.');
    } catch (error) {
      console.error('Error al importar productos:', error);
      if (!dryRun) {
        message.error('Hubo un problema al importar el archivo.');
      }
    } finally {
      if (!dryRun) {
        // Dejamos el modal visible 2 segundos más para que se vea el 100%
        setTimeout(() => setShowProgress(false), 2000);
      }
    }
  };

  const handleCreateTemplate = async (language = 'es', optionalFields = []) => {
    try {
      await createProductTemplate(language, optionalFields);
      message.success('Plantilla creada exitosamente.');
    } catch (error) {
      console.error('Error al crear la plantilla:', error);
      message.error('Hubo un problema al crear la plantilla.');
    }
  };

  const handleExport = () => {
    const tax = {
      0: 'Exento',
      16: '16%',
      18: '18%',
    };

    const productsArray = getProducts(products, taxReceiptEnabled);
    const productsTaxTransformed = productsArray.map((product) => ({
      ...product,
      pricing: {
        ...product.pricing,
        tax: taxReceiptEnabled
          ? product.pricing.tax
            ? tax[product.pricing.tax]
            : 'Exento'
          : 'Exento',
      },
    }));

    ExportProducts(productsTaxTransformed);
  };
  const handleNormalizeItbis = async () => {
    if (!user?.businessID) {
      message.error(
        'No se identificó un negocio para normalizar los impuestos.',
      );
      return;
    }
    const key = 'normalize-itbis';
    message.open({
      key,
      type: 'loading',
      content: 'Normalizando impuestos de productos...',
      duration: 0,
    });
    try {
      const summary = await normalizeProductTaxes(user);
      const {
        productsUpdated,
        mainUpdated,
        saleUnitsUpdated,
        selectedUnitUpdated,
      } = summary;
      const details = [
        productsUpdated ? `${productsUpdated} productos` : null,
        mainUpdated ? `${mainUpdated} precios base` : null,
        saleUnitsUpdated ? `${saleUnitsUpdated} unidades de venta` : null,
        selectedUnitUpdated
          ? `${selectedUnitUpdated} unidades seleccionadas`
          : null,
      ]
        .filter(Boolean)
        .join(', ');
      message.open({
        key,
        type: 'success',
        content: details
          ? `Impuestos normalizados: ${details}.`
          : 'No se encontraron impuestos para actualizar.',
        duration: 4,
      });
    } catch (error) {
      console.error('Error al normalizar ITBIS:', error);
      message.open({
        key,
        type: 'error',
        content: 'No se pudo normalizar los impuestos. Intenta de nuevo.',
        duration: 6,
      });
    }
  };
  const options = [
    {
      text: 'Importar Productos',
      description: 'Productos en lista.',
      icon: <FontAwesomeIcon icon={faFileImport} />,
      action: () => setImportDialogOpen(true),
      closeWhenAction: true,
    },
    {
      text: 'Exportar Productos',
      description: 'Exporta productos a un archivo Excel.',
      icon: <FontAwesomeIcon icon={faFileExport} />,
      action: handleExport,
      closeWhenAction: true,
    },
  ];
  if (import.meta.env.DEV) {
    options.push({
      text: 'Normalizar ITBIS',
      description: 'Corrige impuestos guardados como texto (solo QA).',
      icon: <FontAwesomeIcon icon={faWrench} />,
      action: handleNormalizeItbis,
      closeWhenAction: true,
    });
  }
  return (
    matchWithInventory && (
      <Container>
        {side === 'right' && (
          <Fragment>
            <ButtonGroup>
              <DropdownMenu
                title={vw > 900 ? 'Herramientas' : ''}
                icon={
                  vw <= 900 ? (
                    <FontAwesomeIcon icon={faEllipsisVertical} />
                  ) : undefined
                }
                options={options}
                borderRadius="normal"
              />
              <AddProductButton />
            </ButtonGroup>
            <ImportModal
              open={importDialogOpen}
              onClose={() => setImportDialogOpen(false)}
              onImport={handleImport}
              onCreateTemplate={handleCreateTemplate}
            />
            <ImportProgressModal
              visible={showProgress}
              progress={importProgress}
            />
          </Fragment>
        )}
        {side === 'left' && (
          <Fragment>
            <ButtonGroup>
              <InventoryFilterAndSort contextKey="inventory" />
            </ButtonGroup>
          </Fragment>
        )}
      </Container>
    )
  );
};
const Container = styled.div``;
