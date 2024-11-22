import React, { useState } from 'react'
import { Form, Input, Select, DatePicker } from 'antd'
import styled from 'styled-components'
import EvidenceUpload from './EvidenceUpload'
import ProductsTable from './ProductsTable'
import TotalsSummary from './TotalsSummary'
import AddProduct from './AddProduct'

const { TextArea } = Input
const { Option } = Select

// Simulated product list - replace with your actual data source
const productOptions = [
    { value: '1', label: 'Producto 1' },
    { value: '2', label: 'Producto 2' },
    { value: '3', label: 'Producto 3' },
    // Add more products as needed
]

const GeneralForm = ({ purchaseData, handleInputChange, products, showProductModal, removeProduct, totals }) => {
    const [options, setOptions] = useState(productOptions)
    const [editingProduct, setEditingProduct] = useState(null);
    const onSearch = (searchText) => {
        setOptions(
            productOptions.filter(item =>
                item.label.toLowerCase().includes(searchText.toLowerCase())
            )
        )
    }
    const handleProductSave = (values) => {
        if (editingProduct) {
          // Edit existing product
          const updatedProducts = purchaseData.products.map((p, idx) =>
            idx === editingProduct.index ? { ...values, totalCost: calculateProductTotal(values) } : p
          );
          setPurchaseData(prev => ({ ...prev, products: updatedProducts }));
        } else {
          // Add new product
          setPurchaseData(prev => ({
            ...prev,
            products: [
              ...prev.products,
              { ...values, totalCost: calculateProductTotal(values) }
            ]
          }));
        }
        setModalVisible(false);
        setEditingProduct(null);
      };

    return (
        <>
            <Group>
                <Form.Item label="Nombre del Proveedor" required>
                    <Select name="supplierName" value={purchaseData.supplierName} onChange={handleInputChange} required>
                        <Option value="Proveedor 1">Proveedor 1</Option>
                        <Option value="Proveedor 2">Proveedor 2</Option>
                        <Option value="Proveedor 3">Proveedor 3</Option>
                    </Select>
                </Form.Item>
                <Form.Item label="Seleccionar Pedido" required>
                    <Select name="orderSelection" value={purchaseData.orderSelection} onChange={handleInputChange} required>
                        <Option value="Pedido 1">Pedido 1</Option>
                        <Option value="Pedido 2">Pedido 2</Option>
                        <Option value="Pedido 3">Pedido 3</Option>
                    </Select>
                </Form.Item>
                <Form.Item label="Número de Factura">
                    <Input name="orderNumber" value={purchaseData.orderNumber} onChange={handleInputChange} required />
                </Form.Item>
                <Form.Item label="Comprobante de Compra">
                    <Input name="purchaseReceipt" value={purchaseData.purchaseReceipt} onChange={handleInputChange} required />
                </Form.Item>
            </Group>
            <AddProduct
                onSave={handleProductSave}
                initialData={editingProduct}
            />
            <ProductsTable
                products={products}
                showProductModal={showProductModal}
                removeProduct={removeProduct}
                onEditProduct={showProductModal}
            />
            <TotalsSummary totals={totals} />
            <Group>
                <Form.Item label="Condición" required>
                    <Select name="condition" value={purchaseData.condition} onChange={handleInputChange} required>
                        <Option value="Condición 1">Condición 1</Option>
                        <Option value="Condición 2">Condición 2</Option>
                        <Option value="Condición 3">Condición 3</Option>
                    </Select>
                </Form.Item>
            </Group>
            <Group>
                <Form.Item label="Fecha de Entrega" style={{ width: '100%' }} required>
                    <DatePicker name="deliveryDate" value={purchaseData.deliveryDate} onChange={handleInputChange} required style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Fecha de Pago" style={{ width: '100%' }}>
                    <DatePicker name="paymentDate" value={purchaseData.paymentDate} onChange={handleInputChange} required style={{ width: '100%' }} />
                </Form.Item>
            </Group>
            <EvidenceUpload />
            <Form.Item label="Notas">
                <TextArea name="notes" value={purchaseData.notes} onChange={handleInputChange} />
            </Form.Item>
        </>
    )
}

export default GeneralForm

const Group = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1em;
    @media (width <= 768px) {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
`
