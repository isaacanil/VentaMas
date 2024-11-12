import React from 'react'
import { Tabs } from 'antd';
import { General } from './components/General/General';
import BatchList from './components/Batch/BatchList/BatchList';
import { useSelector } from 'react-redux';
import { selectUpdateProductData } from '../../../../features/updateProduct/updateProductSlice';
import { SaleUnitsConfig } from './components/SaleUnits/SaleUnitsConfig';

export const ProductForm = ({ showImageManager }) => {
    const { status } = useSelector(selectUpdateProductData)
    const items = [
        {
            key: '1',
            label: 'General',
            children: <General showImageManager={showImageManager} />
        },
        {
            key: '2',
            label: 'Lote',
            disabled: status === "create",
            children: <BatchList/>
        },
        {
            key: '3',
            label: 'Unidades de Venta', // Nuevo label para la tercera pestaña
            disabled: status === "create",
            children: <SaleUnitsConfig />
        },
    ]
    return (
        <Tabs
            defaultActiveKey="1"
            items={items}
        />
    )
}
