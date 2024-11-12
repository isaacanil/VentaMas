import React from 'react'
import styled from 'styled-components'
import { EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Tooltip } from 'antd'
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice'

const CustomCardContainer = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 300px;

`
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

`
const CardFooter = styled.div`
  margin-top: 16px;
`


export const SaleUnit = ({ unit, onEdit, onDelete, onInfo }) => {
    const handleViewInfo = (e) => {
        e.stopPropagation()
        onInfo()
    }
    const handleEdit = (e) => {
        e.stopPropagation()
        onEdit()
    }
    const handleDelete = (e) => {
        e.stopPropagation()
        onDelete()
    }
    return (
        <CustomCardContainer onClick={handleViewInfo}>
            <CardHeader>
                <span>{unit?.unitName}</span>
                <div>
                    <Tooltip title="Editar">
                        <Button type="text" icon={<EditOutlined />} onClick={handleEdit} size="small" style={{ marginRight: '8px' }} />
                    </Tooltip>
                    <Button type="link" danger onClick={handleDelete} icon={<DeleteOutlined />} size="small" />


                </div>
            </CardHeader>
            <CardFooter>
                <p>Cantidad: {unit?.quantity}</p>
                <p>Precio: {useFormatPrice(unit?.pricing?.listPrice)}</p>
            </CardFooter>
        </CustomCardContainer>
    )
}
