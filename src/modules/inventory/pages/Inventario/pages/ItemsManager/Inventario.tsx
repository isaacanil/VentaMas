import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { useGetProducts } from '@/firebase/products/fbGetProducts.js';
import { PageShell } from '@/components/layout/PageShell';
import { OPERATION_MODES } from '@/constants/modes';
import {
  openModalUpdateProd,
  SelectUpdateProdModal,
} from '@/features/modals/modalSlice';
import { ChangeProductData } from '@/features/updateProduct/updateProductSlice';
import { useBarcodeScanner } from '@/hooks/barcode/useBarcodeScanner';
import type { BarcodeScanMeta } from '@/hooks/barcode/useBarcodeScanner';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import {
  getBarcodeLookupCandidates,
  normalizeBarcodeValue,
} from '@/utils/barcode';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type { ProductRecord } from '@/types/products';

import { ProductRecordList } from './components/ProductTable/ProductRecordList';
import { ProductsTable } from './components/ProductTable/ProductsTable';

export const Inventory = () => {
  const dispatch = useDispatch();
  const isProductEditorModalOpen = useSelector(SelectUpdateProdModal);
  const [searchTerm, setSearchTerm] = useState('');
  const { products = [] } = useGetProducts();
  const vw = useViewportWidth();
  const productList = products as ProductRecord[];

  const productsByBarcode = useMemo(() => {
    const map = new Map<string, ProductRecord>();
    for (const product of productList) {
      const normalizedBarcode = normalizeBarcodeValue(product?.barcode);
      if (!normalizedBarcode) continue;

      const barcodeCandidates = getBarcodeLookupCandidates(normalizedBarcode);
      for (const candidate of barcodeCandidates) {
        if (!map.has(candidate)) {
          map.set(candidate, product);
        }
      }
    }
    return map;
  }, [productList]);

  const openProductEditModal = useCallback(
    (product: ProductRecord) => {
      dispatch(openModalUpdateProd());
      dispatch(
        ChangeProductData({
          product,
          status: OPERATION_MODES.UPDATE.label,
        }),
      );
    },
    [dispatch],
  );

  const handleBarcodeScan = useCallback(
    (barcode: string, scanMeta?: BarcodeScanMeta) => {
      // Si el modal de edición está abierto, no reaccionar al scanner de la pantalla.
      if (isProductEditorModalOpen) return;

      // Si el escaneo ocurrió dentro de un input/textarea/select,
      // dejamos que solo escriba en el campo activo.
      if (scanMeta?.fromEditable) return;

      const normalizedBarcode = normalizeBarcodeValue(barcode);
      if (!normalizedBarcode) return;

      const scannedCandidates = getBarcodeLookupCandidates(normalizedBarcode);
      let productMatch: ProductRecord | undefined;
      for (const candidate of scannedCandidates) {
        productMatch = productsByBarcode.get(candidate);
        if (productMatch) break;
      }

      if (!productMatch) return;

      openProductEditModal(productMatch);
    },
    [isProductEditorModalOpen, openProductEditModal, productsByBarcode],
  );

  useBarcodeScanner(handleBarcodeScan, {
    minLength: 8,
    enabled: !isProductEditorModalOpen,
  });

  return (
    <>
      <MenuApp
        displayName="Productos"
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <Container>
        {vw > 900 ? (
          <ProductsTable products={productList} searchTerm={searchTerm} />
        ) : (
          <ProductRecordList products={productList} searchTerm={searchTerm} />
        )}
      </Container>
    </>
  );
};

const Container = styled(PageShell)`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background-color: var(--white);
`;
