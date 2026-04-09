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

import { selectUser } from '@/features/auth/userSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { useGetProducts } from '@/firebase/products/fbGetProducts';
import { ExportProducts } from '@/hooks/exportToExcel/useExportProducts';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import ROUTES_NAME from '@/router/routes/routesName';
import { getProducts } from '@/utils/pricing';
import ImportModal from '@/components/modals/ImportModal/ImportModal';
import ImportProgressModal from '@/components/modals/ImportProgressModal/ImportProgressModal';
import { InventoryFilterAndSort } from '@/modules/inventory/pages/Inventario/pages/ItemsManager/components/InvetoryFilterAndSort/InventoryFilterAndSort';
import { AddProductButton } from '@/components/ui/Button/AddProductButton';
import { ButtonGroup } from '@/components/ui/Button/Button';
import { DropdownMenu } from '@/components/ui/DropdownMenu/DropdowMenu';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';
import type { UserIdentity, UserWithBusiness } from '@/types/users';
import type { ProductRecord } from '@/types/products';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { hasManageAllAccess } from '@/utils/access/manageAllAccess';

import {
  createInventoryTemplate,
  runProductImport,
} from './utils/importProducts';
import {
  runInventoryTaxNormalization,
  runInventoryTrackNormalization,
} from './utils/normalizeInventory';

export type ImportProgressStats = {
  totalProducts: number;
  processedProducts: number;
  updatedProducts: number;
  newProducts: number;
  newCategories: number;
  newIngredients: number;
  updatedIngredients: number;
};

export type ImportOptions = {
  dryRun?: boolean;
};

export type InventoryProduct = {
  activeIngredients?: string | null;
  pricing?: { tax?: number | string | null };
} & Record<string, unknown>;

export const InventoryMenuToolbar = ({
  side = 'left',
}: ToolbarComponentProps) => {
  const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM;
  const matchWithInventory = useMatch(INVENTORY_ITEMS);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled) as boolean;
  const { products } = useGetProducts() as { products?: InventoryProduct[] };
  const user = useSelector(selectUser) as UserIdentity | null;
  const vw = useViewportWidth();
  const [importProgress, setImportProgress] = useState<ImportProgressStats>({
    totalProducts: 0,
    processedProducts: 0,
    updatedProducts: 0,
    newProducts: 0,
    newCategories: 0,
    newIngredients: 0,
    updatedIngredients: 0,
  });
  const [showProgress, setShowProgress] = useState(false);

  const handleImport = async (
    file: File,
    { dryRun = false }: ImportOptions = {},
  ) => {
    const userWithBusiness =
      user?.businessID && user.uid ? (user as UserWithBusiness) : null;

    if (!dryRun) {
      setShowProgress(true);
    }

    const result = await runProductImport(
      file,
      userWithBusiness,
      setImportProgress,
      { dryRun },
    );

    if (result.errorMessage) {
      message.error(result.errorMessage);
    }

    if (!dryRun && !result.errorMessage) {
      message.success('Archivo importado correctamente.');
    }

    if (!dryRun) {
      // Dejamos el modal visible 2 segundos más para que se vea el 100%
      setTimeout(() => setShowProgress(false), 2000);
    }

    return result.importedProducts;
  };

  const handleCreateTemplate = async (
    language: 'es' | 'en' = 'es',
    optionalFields: string[] = [],
  ) => {
    await createInventoryTemplate(language, optionalFields);
  };

  const handleExport = () => {
    const taxLabels: Record<number, string> = {
      0: 'Exento',
      16: '16%',
      18: '18%',
    };

    const productsArray = getProducts(
      (products ?? []) as ProductRecord[],
      taxReceiptEnabled,
    ) as InventoryProduct[];
    const productsTaxTransformed = productsArray.map((product) => {
      const rawTax = product.pricing?.tax;
      const taxKey =
        typeof rawTax === 'number' || typeof rawTax === 'string'
          ? Number(rawTax)
          : null;
      const resolvedTax =
        taxReceiptEnabled && taxKey !== null && taxLabels[taxKey]
          ? taxLabels[taxKey]
          : 'Exento';
      return {
        ...product,
        pricing: {
          ...(product.pricing ?? {}),
          tax: resolvedTax,
        },
      };
    });

    ExportProducts(productsTaxTransformed as ProductRecord[]);
  };
  const handleNormalizeItbis = () => {
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
    void runInventoryTaxNormalization(user as UserWithBusiness).then((result) => {
      if (result.status === 'error') {
        message.open({
          key,
          type: 'error',
          content: result.errorMessage,
          duration: 6,
        });
        return;
      }

      const {
        productsUpdated,
        mainUpdated,
        saleUnitsUpdated,
        selectedUnitUpdated,
      } = result.summary;
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
    });
  };
  const handleNormalizeTrackInventory = () => {
    if (!user?.businessID) {
      message.error(
        'No se identificó un negocio para normalizar el inventario.',
      );
      return;
    }
    const key = 'normalize-track-inventory';
    message.open({
      key,
      type: 'loading',
      content: 'Normalizando rastreo de inventario...',
      duration: 0,
    });
    void runInventoryTrackNormalization(user as UserWithBusiness).then(
      (result) => {
        if (result.status === 'error') {
          message.open({
            key,
            type: 'error',
            content: result.errorMessage,
            duration: 6,
          });
          return;
        }

        const { updated } = result.summary;
        message.open({
          key,
          type: 'success',
          content: updated
            ? `Se actualizaron ${updated} productos.`
            : 'No se encontraron productos para actualizar.',
          duration: 4,
        });
      },
    );
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
  // Solo visible para rol 'dev' o en entorno local
  if (import.meta.env.DEV || hasDeveloperAccess(user)) {
    options.push({
      text: 'Normalizar ITBIS',
      description: 'Corrige impuestos guardados como texto (solo QA).',
      icon: <FontAwesomeIcon icon={faWrench} />,
      action: handleNormalizeItbis,
      closeWhenAction: true,
    });
  }

  // Visible para usuarios con privilegios globales (dev/owner/admin) o en entorno local
  if (import.meta.env.DEV || hasManageAllAccess(user)) {
    options.push({
      text: 'Normalizar Inventariable',
      description:
        'Activa el rastreo de inventario en productos que lo tengan vacío.',
      icon: <FontAwesomeIcon icon={faWrench} />,
      action: handleNormalizeTrackInventory,
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
