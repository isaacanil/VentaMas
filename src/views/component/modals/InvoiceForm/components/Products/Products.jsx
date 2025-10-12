import * as antd from 'antd'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'

import { icons } from '../../../../../../constants/icons/icons'
import { addProductInvoiceForm, changeAmountToBuyProduct, deleteProductInvoiceForm } from '../../../../../../features/invoice/invoiceFormSlice'
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice'

const { Button, Input, Table } = antd
import { useGetProducts } from '../../../../../../firebase/products/fbGetProducts'
import { getTotalPrice } from '../../../../../../utils/pricing'

import { ProductListModal } from './ProductListModal'

const getProductQuantity = (product) => {
    if (!product) return 1
    const { amountToBuy } = product

    if (typeof amountToBuy === 'number') {
        return amountToBuy > 0 ? amountToBuy : 1
    }

    if (amountToBuy && typeof amountToBuy === 'object') {
        const total = Number(amountToBuy.total)
        const unit = Number(amountToBuy.unit)

        if (!Number.isNaN(total) && total > 0) return total
        if (!Number.isNaN(unit) && unit > 0) return unit
    }

    return 1
}

const getFormattedUnitPrice = (product) => {
    const quantity = getProductQuantity(product)
    const total = getTotalPrice(product)
    const unitPrice = quantity > 0 ? total / quantity : total
    return useFormatPrice(unitPrice)
}

const getFormattedTotalPrice = (product) => useFormatPrice(getTotalPrice(product))

export const Products = ({ invoice }) => {
    const dispatch = useDispatch()
    const [isProductListModalVisible, setProductListModalVisible] = useState(false)
    const {products} = useGetProducts()
   
    const columns = [
        {
            title: 'Producto',
            dataIndex: 'name',
            key: 'productName',
        },
        {
            title: 'Cantidad',
            dataIndex: 'amountToBuy',
            key: 'amountToBuy',
            render: (text, record, index) => (
                <Counter>
                    <Button
                        onClick={() => dispatch(changeAmountToBuyProduct({ product: record, type: "subtract" }))}
                        icon={icons.mathOperations.subtract}
                    />
                    <Input
                        value={record.amountToBuy}
                        onChange={(e) => {
                            const value = e.target.value;
                            const isValidNumber = !isNaN(parseFloat(value)) && isFinite(value);
                            if (isValidNumber) {
                                dispatch(changeAmountToBuyProduct({ product: record, amount: Number(value), type: "change" }))
                            }
                        }}
                    />
                    <Button
                        onClick={() => dispatch(changeAmountToBuyProduct({ product: record, type: "add" }))}
                        icon={icons.operationModes.add}
                    />
                </Counter>
            ),
        },
        {
            title: 'Precio Unitario',
            dataIndex: 'price',
            key: 'unitPrice',
            render: (_, record) => getFormattedUnitPrice(record),
        },
        {
            title: 'Precio Total',
            key: 'totalPrice',
            render: (_, record) => getFormattedTotalPrice(record),
        },
        {
            title: 'Acciones',
            key: 'actions',

            render: (text, record) => (
                <Button
                    onClick={() => dispatch(deleteProductInvoiceForm({ product: record, }))}
                    icon={icons.operationModes.delete}
                />
            ),
        }
    ];
    const paginationConfig = {
        pageSize: 5,
        position: ["bottomCenter"]
    }
    const showProductListModal = () => {
        setProductListModalVisible(true)
    }
    const handleAddProduct = (product) => {
        dispatch(addProductInvoiceForm({ product }))
        setProductListModalVisible(false)
    }
    return (
        <Container>
            <ActionsContainer>
                <Button type="primary" onClick={showProductListModal}>
                    Añadir Producto
                </Button>
            </ActionsContainer>
            <Table
                size='small'
                dataSource={invoice?.products}
                columns={columns}

                pagination={paginationConfig}
                rowKey="id"
            />
            <ProductListModal
                isVisible={isProductListModalVisible}
                onClose={() => setProductListModalVisible(false)}
                products={products}
                onAddProduct={handleAddProduct}
            />
        </Container>
    )
}

const Container = styled.div`

`
const Counter = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: 2em 80px 2em;
`
const ActionsContainer = styled.div`
  text-align: right; // Esto alinea tu botón a la derecha
  margin-bottom: 16px; // Para que no quede tan pegado al input
`