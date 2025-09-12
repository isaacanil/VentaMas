import React, { useState, useEffect, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { ProductItem } from './ProductCard/ProductItem'
import { ProductCardRow } from './ProductCard/ProductCardRow'
import { Carrusel } from '../../../../../../component/Carrusel/Carrusel'
import { FormattedValue } from '../../../../../../templates/system/FormattedValue/FormattedValue'
import { CenteredText } from '../../../../../../templates/system/CentredText'
import { icons } from '../../../../../../../constants/icons/icons'
import { openModalUpdateProd } from '../../../../../../../features/modals/modalSlice'
import { ChangeProductData, selectUpdateProductData } from '../../../../../../../features/updateProduct/updateProductSlice'
import { OPERATION_MODES } from '../../../../../../../constants/modes'
import { handleDeleteProductAlert } from '../../../../../../../features/Alert/AlertSlice'
import { ButtonGroup } from '../../../../../../templates/system/Button/Button'
import StockIndicator from '../../../../../../templates/system/labels/StockIndicator'
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice'
import { ImgCell } from '../../../../../../templates/system/AdvancedTable/components/Cells/Img/ImgCell'
import { AdvancedTable } from '../../../../../../templates/system/AdvancedTable/AdvancedTable'
import { useDialog } from '../../../../../../../Context/Dialog/DialogContext'
import { fbDeleteProduct } from '../../../../../../../firebase/products/fbDeleteproduct'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { getTax, getTotalPrice } from '../../../../../../../utils/pricing'
import * as antd from 'antd'
//quiero el iconos d elos tres punto verticales

import { EditOutlined, DeleteOutlined, MoreOutlined, PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { store } from '../../../../../../../app/store'
import { toggleBarcodeModal } from '../../../../../../../features/barcodePrintModalSlice/barcodePrintModalSlice'
import { selectTaxReceiptEnabled } from '../../../../../../../features/taxReceipt/taxReceiptSlice'
import { ProductCategoryBar } from '../../../../../../component/ProductCategoryBar/ProductCategoryBar'
import { useFormatNumber } from '../../../../../../../hooks/useFormatNumber'
import { filterData } from '../../../../../../../hooks/search/useSearch'
const { Button, Dropdown, Menu } = antd;

export const ProductsTable = ({ products, searchTerm }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const { setDialogConfirm } = useDialog();
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [totalsDismissed, setTotalsDismissed] = useState(false)

  const handleDeleteProduct = useCallback((id) => {
    let docId = id?.product?.id ? id?.product?.id : id?.id
    setDialogConfirm({
      title: 'Eliminar producto',
      isOpen: true,
      type: 'error',
      message: '¿Está seguro que desea eliminar este producto?',
      onConfirm: async () => {
        const currentUser = selectUser(store.getState());
        await fbDeleteProduct(currentUser, docId);
      }
    })
  }, [user])

  const handleUpdateProduct = (product) => {
    dispatch(openModalUpdateProd());
    dispatch(ChangeProductData({ product: product, status: OPERATION_MODES.UPDATE.label }));
  };

  const columns = [
    {
      Header: 'Nombre',
      accessor: 'name',
      reorderable: false,
      minWidth: '300px',
      maxWidth: '1fr',
      sortable: true,
      sortableValue: (value) => value.name,
      cell: ({ value }) => (
        <ProductName>
          <ImgCell img={value.img} />
          <span>{value.name}</span>
        </ProductName>
      )
    },
    {
      Header: 'Stock',
      accessor: 'stock',
      align: 'right',
      sortable: true,
      sortableValue: (value) => value.stock,
      minWidth: '80px',
      maxWidth: '140px',
      cell: ({ value }) => <StockIndicator stock={useFormatNumber(value.stock)} trackInventory={value.trackInventory}></StockIndicator>
    },
    {
      Header: 'Costo',
      align: 'right',
      sortable: true,
      accessor: 'cost',
      minWidth: '120px',
      maxWidth: '0.4fr',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Impuesto',
      sortable: true,
      align: 'right',
      minWidth: '120px',
      maxWidth: '0.4fr',
      accessor: 'tax',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Precio',
      sortable: true,
      accessor: 'price',
      minWidth: '120px',
      maxWidth: '0.4fr',
      align: 'right',
      cell: ({ value }) => {
        const price = getTotalPrice(value, taxReceiptEnabled)
        const unit = value?.weightDetail?.weightUnit
        const isSoldByWeight = value?.weightDetail?.isSoldByWeight
        if (isSoldByWeight) {
          return (
            <div>{useFormatPrice(price)} / {unit}</div>
          )
        }
        return useFormatPrice(price)
      }
    },
    {
      Header: 'Facturable',
      accessor: 'isVisible',
      minWidth: '100px',
      maxWidth: '100px',
      align: 'center',
      cell: ({ value }) => <div>{value === false && icons.operationModes.hide}</div>
    },
    {
      Header: 'Acción',
      accessor: 'action',
      reorderable: false,
      minWidth: '100px',
      maxWidth: '100px',
      align: 'right',
      clickable: false,
      cell: ({ value }) => {
        const menu = {
          items: [
            {
              label: "Editar",
              key: 1,
              icon: <EditOutlined />,
              onClick: () => handleUpdateProduct(value)
            },
            {
              label: "Imprimir Barcode",
              key: 2,
              icon: <PrinterOutlined />,
              onClick: () => dispatch(toggleBarcodeModal(value))
            },
            {
              label: "Eliminar",
              key: 3,
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDeleteProduct(value)
            }
          ]
        }

        return (
          <ButtonGroup>
            <Dropdown menu={menu}>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </ButtonGroup>
        )
      }
    }
  ];

  const data = products.map((product) => ({
    id: product.id,
    image: product.image,
    name: { name: product.name, img: product.image },
    stock: { stock: product.stock, trackInventory: product.trackInventory },
    trackInventory: product.trackInventory,
    cost: product?.pricing?.cost,
    price: product,
    tax: getTax(product),
    isVisible: product?.isVisible,
    action: product,
    category: product.category,
  }));

  // Totales (filtrados por el término de búsqueda actual)
  const filteredProducts = useMemo(() => filterData(products, searchTerm), [products, searchTerm])
  const totals = useMemo(() => {
    let stock = 0
    let cost = 0
    let listPrice = 0
    for (const p of filteredProducts) {
      const qty = Number(p?.stock) || 0
      const unitCost = Number(p?.pricing?.cost) || 0
      // Preferir listPrice; si no hay, usar price como aproximación
      const unitListPrice = (typeof p?.pricing?.listPrice === 'number' && p.pricing.listPrice)
      stock += qty
      cost += qty * unitCost
      listPrice += qty * unitListPrice
    }
    return { stock, cost, listPrice }
  }, [filteredProducts])

  // Recibe métricas de scroll del cuerpo de la tabla para ocultar la píldora al llegar abajo
  const handleScrollMetrics = useCallback(({ isAtBottom }) => {
    setIsAtBottom(!!isAtBottom)
  }, [])

  return (
    <>
      <AdvancedTable
        data={data}
        columns={columns}
        searchTerm={searchTerm}
        headerComponent={<ProductCategoryBar />}
        tableName={'inventory_items_table'}
        elementName={'productos'}
        onRowClick={(row) => handleUpdateProduct(row.action)}
        groupBy={'category'}
        onScrollMetrics={handleScrollMetrics}
      />
      <FloatingTotals $hidden={isAtBottom || totalsDismissed}>
        <TotalsContainer>
          <span>Stock: {useFormatNumber(totals.stock)}</span>
          <Divider>|</Divider>
          <span>Costo: {useFormatPrice(totals.cost)}</span>
          <Divider>|</Divider>
          <span>Precio lista: {useFormatPrice(totals.listPrice)}</span>
          <CloseButton
            type="text"
            size="small"
            aria-label="Ocultar totales"
            onClick={() => setTotalsDismissed(true)}
            icon={<CloseOutlined />}
          />
        </TotalsContainer>
      </FloatingTotals>
    </>
  )
}
const ProductName = styled.div`
  display: flex;
  align-items: center;
  height: 100%;                     
  gap: 1.2em;
`

// Totales en el pie de tabla
const TotalsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;
  font-weight: 600;
  white-space: nowrap;
`

const Divider = styled.span`
  color: var(--Gray6);
`

// Píldora flotante con totales
const FloatingTotals = styled.div`
  position: fixed;
  right: 16px;
  bottom: 50px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  padding: 8px 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  opacity: ${p => p.$hidden ? 0 : 1};
  transform: translateY(${p => p.$hidden ? '8px' : '0'});
  transition: opacity .2s ease, transform .2s ease;
  pointer-events: ${p => p.$hidden ? 'none' : 'auto'};
  @media (max-width: 600px) {
    right: 8px;
    bottom: 8px;
    padding: 6px 10px;
    font-size: 12px;
  }
`

// Botón de cerrar con estilo mínimo (reutiliza antd Button)
const CloseButton = styled(antd.Button)`
  margin-left: 8px;
  color: var(--Gray6);
  &:hover {
    color: var(--Gray3);
  }
`
