import React, { useMemo } from 'react'
import { AdvancedTable, Img, ImgContainer } from './AdvancedTable';
import { useGetProducts } from '../../../firebase/products/fbGetProducts';
import { useFormatPrice } from '../../../hooks/useFormatPrice';
import StockIndicator from '../../templates/system/labels/StockIndicator';
import { Carrusel } from '../../component/Carrusel/Carrusel';
import { Button, ButtonGroup } from '../../templates/system/Button/Button';
import { icons } from '../../../constants/icons/icons';
import { useDispatch } from 'react-redux';

import { openModalUpdateProd } from '../../../features/modals/modalSlice';
import { ChangeProductData } from '../../../features/updateProduct/updateProductSlice';
import { handleDeleteProductAlert } from '../../../features/Alert/AlertSlice';
import { OPERATION_MODES } from '../../../constants/modes';

export const Table = () => {
  const dispatch = useDispatch();
  const handleDeleteProduct = (id) => {
      dispatch(handleDeleteProductAlert({id}));
  };
  const handleUpdateProduct = (product) => {
 
      dispatch(openModalUpdateProd());
      dispatch(ChangeProductData({ product: product, status: OPERATION_MODES.UPDATE.label }));
  };
  const columns = [
    {
      Header: 'Imagen',
      accessor: 'image',
      minWidth: '60px',
      
      maxWidth: '90px',
      cell: ({ value }) => <ImgContainer>
        <Img src={value} ></Img>
      </ImgContainer>,
    },
    {
      Header: 'Nombre',
      accessor: 'name',
      minWidth: '200px',
      sortable: true,
      maxWidth: '300px',
    },
    {
      Header: 'Stock',
      accessor: 'stock',
      minWidth: '80px',
      maxWidth: '80px',
      cell: ({ value }) => <StockIndicator stock={value.stock} trackInventory={value.trackInventory}></StockIndicator>
    },
    {
      Header: 'Costo',
      align: 'right',
      sortable: true,
      accessor: 'cost',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Precio',
      sortable: true,
      accessor: 'price',
      align: 'right',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Impuesto',
      sortable: true,
      align: 'right',
      accessor: 'tax',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Acción',
      accessor: 'action',
      minWidth: '100px',
      maxWidth: '100px',
      align: 'right',
      cell: ({ value }) => {
        return (
        <ButtonGroup>
          <Button
            startIcon={icons?.operationModes?.edit}
            borderRadius='normal'
            color={'gray-dark'}
            width='icon32'
            bgcolor='editar'
            onClick={() => handleUpdateProduct(value)}
          />
          <Button
            startIcon={icons.operationModes.delete}
            width='icon32'
            color={'gray-dark'}
            borderRadius='normal'
            onClick={() => handleDeleteProduct(value.id)}
          />
        </ButtonGroup>
      )}
    }
  ];

  const { products } = useGetProducts();

  const data = products.map(({ product }) => ({
    image: product.productImageURL,
    name: product.productName,
    stock: { stock: product.stock, trackInventory: product.trackInventory },
    trackInventory: product.trackInventory,
    cost: product.cost.unit,
    price: product.price.unit,
    tax: product.tax.value * product.cost.unit,
    action: product

  }));

  return (
    <div>
      <AdvancedTable headerComponent={<Carrusel />} columns={columns} data={data} />
    </div>
  )
}
