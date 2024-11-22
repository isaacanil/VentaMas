import React, { useState, useEffect } from 'react'
import { Button, Tabs, Card, Space, Form, notification } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import GeneralForm from './components/GeneralForm'
import ProductsTable from './components/ProductsTable'
import TotalsSummary from './components/TotalsSummary'
import EvidenceUpload from './components/EvidenceUpload'
import AddProduct from './components/AddProduct'
import { MenuApp } from '../../../templates/MenuApp/MenuApp'

const { TabPane } = Tabs

const Wrapper = styled.div`
  padding: 24px;
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
`

const PurchaseManagement = () => {
  const [purchaseData, setPurchaseData] = useState({
    supplierId: '',
    supplierName: '',
    orderNumber: '',
    invoiceNumber: '',
    receiptNumber: '',
    paymentCondition: '',
    deliveryDate: '',
    paymentDate: '',
    notes: '',
    totals: {
      totalProducts: 0,
      totalBaseCost: 0,
      totalITBIS: 0,
      totalFreight: 0,
      totalOtherCosts: 0,
      grandTotal: 0
    },
    evidenceFiles: [],
    createdBy: '',
    products: []
  })

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setPurchaseData(prev => ({ ...prev, [name]: value }))
  }

  const showProductModal = (product = null) => {
    setEditingProduct(product ? { ...product } : null);
    setModalVisible(true);
  };

  const calculateProductTotal = (product) => {
    const calculatedITBIS = (product.baseCost * product.taxRate) / 100;
    return (product.baseCost || 0) +
      calculatedITBIS +
      (product.freight || 0) +
      (product.otherCosts || 0);
  };

  const removeProduct = (index) => {
    setPurchaseData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const calculateTotals = () => {
    const totals = purchaseData.products.reduce((acc, product) => {
      const calculatedITBIS = (product.baseCost * product.taxRate) / 100;
      return {
        totalProducts: acc.totalProducts + 1,
        totalBaseCost: acc.totalBaseCost + product.baseCost,
        totalITBIS: acc.totalITBIS + calculatedITBIS,
        totalFreight: acc.totalFreight + product.freight,
        totalOtherCosts: acc.totalOtherCosts + product.otherCosts,
        grandTotal: acc.grandTotal + product.totalCost
      };
    }, {
      totalProducts: 0,
      totalBaseCost: 0,
      totalITBIS: 0,
      totalFreight: 0,
      totalOtherCosts: 0,
      grandTotal: 0
    });

    setPurchaseData(prev => ({ ...prev, totals }))
  }

  useEffect(() => {
    calculateTotals()
  }, [purchaseData.products])

  return (
    <Container>
      <MenuApp
        sectionName={'Gestión de Compras'}
      />
      <Body>
        <Form layout="vertical">
          <GeneralForm
            purchaseData={purchaseData}
            handleInputChange={handleInputChange}
            products={purchaseData.products}
            showProductModal={showProductModal}
            removeProduct={removeProduct}
            onEditProduct={showProductModal}
            totals={purchaseData.totals}
          />
        </Form>
      </Body>
    </Container>
  )
}

export default PurchaseManagement
const Container = styled.div`
  display: grid;
  gap: 1em;
`
const Body = styled.div`
 padding: 0 1em;

 width: 100%;
  margin: 0 auto;
`