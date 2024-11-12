// SaleUnitsManager.jsx
'use client'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { List, Button, Modal, Popconfirm, Tooltip, Form, Switch } from 'antd'
import { PlusOutlined, } from '@ant-design/icons'
import styled from 'styled-components'
import SaleUnitForm from './SaleUnitForm'
import {  selectUpdateProductData, } from '../../../../../../../features/updateProduct/updateProductSlice'
import { SaleUnit } from './SaleUnit'
import { fbDeleteSaleUnit, useListenSaleUnits } from '../../../../../../../firebase/products/saleUnits/fbUpdateSaleUnit'
import { selectUser } from '../../../../../../../features/auth/userSlice'

const ManagerContainer = styled.div`
  margin-bottom: 20px;
`
const ToggleContainer = styled.div`
  margin-bottom: 20px;
`
const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`
const SaleUnitsManager = ({ onShowPricingModal }) => {
    const dispatch = useDispatch()
    const { product: { id: productId } } = useSelector(selectUpdateProductData)
    const user = useSelector(selectUser)

    const {data: saleUnits} = useListenSaleUnits(productId)


    const [isModalVisible, setIsModalVisible] = useState(false)
    const [currentUnit, setCurrentUnit] = useState(null)

    const showAddModal = () => {
        setCurrentUnit(null)
        setIsModalVisible(true)
    }

    const showEditModal = (unit) => {
        setCurrentUnit(unit)
        setIsModalVisible(true)
    }

    const handleInfo = (unit) => {
        onShowPricingModal(unit)
    }

    const handleSubmit = (values) => {
        setIsModalVisible(false)
        setCurrentUnit(null)
    }
    const handleDelete = (id) => {
        fbDeleteSaleUnit(user, productId, id)
    }
    const handleCancel = () => {
        setIsModalVisible(false)
        setCurrentUnit(null)
    }


    return (
        <ManagerContainer>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                }}
            >


                <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal} style={{ marginBottom: '20px' }}>
                    Unidad de Venta
                </Button>



            </div>
            <CardsContainer>
                {saleUnits.map((unit) => (
                    <SaleUnit
                        key={unit?.id}
                        unit={unit}
                        onEdit={() => showEditModal(unit)}
                        onDelete={() => handleDelete(unit?.id)}
                        onInfo={() => handleInfo(unit)}
                    />
                ))}
                 {saleUnits.length === 0 && (
            <EmptySaleUnitsMessage>No hay unidades de venta configuradas.</EmptySaleUnitsMessage>
        )}
            </CardsContainer>
            <SaleUnitForm
                initialValues={currentUnit}
                isOpen={isModalVisible}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </ManagerContainer>
    )
}

export default SaleUnitsManager

const EmptySaleUnitsMessage = styled.p`
    font-size: 1rem;
    color: #666;
    text-align: center;
    padding: 15px;
    border: 1px dashed #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
`;
