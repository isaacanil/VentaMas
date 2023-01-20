import React from 'react'
import { IoTrashSharp } from 'react-icons/io5'
import { TbEdit } from 'react-icons/tb'
import styled from 'styled-components'
import { Message } from '../../../templates/system/message/Message'
import { Button, ButtonGroup } from '../../../templates/system/Button/Button'

export const OrderItem = ({ cat, index, Row, Col }) => {
   
    const handleDeleteCategory = (id) => {
        deleteCat(id)
    }
    return (
        <Row>
            <Col>
            
                {cat.name}
            </Col>
            <Col>
                <ButtonGroup>
                    
                    <Button
                        borderRadius='normal'
                        title={<TbEdit />}
                        width='icon32'
                        color='gray-dark'
                    />
                    <Button
                        borderRadius='normal'
                        title={<IoTrashSharp />}
                        width='icon32'
                        bgcolor='error'
                        onClick={() => handleDeleteClient(cat.id)}
                    />
                </ButtonGroup>
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

