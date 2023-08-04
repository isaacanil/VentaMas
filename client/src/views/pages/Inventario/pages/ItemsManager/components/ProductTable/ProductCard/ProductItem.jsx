import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'

export const ProductItem = ({ product, Row, Col,  }) => {
    const dispatch = useDispatch()
    const [isOpen, setIsOpen] = useState(false)
    const [showNote, setShowNote] = useState(false)
    console.log(product)
   
    return (
        <Row>
            <Col>
            <Img>
              <img src={product.productImageURL} alt="" />
            </Img>
            </Col>
            <Col size='limit'>
                
                
            </Col>
            <Col>
      
            </Col>
            
            <Col>
         
            </Col>
            <Col position='right'>
          
            </Col>
            <Col>
          
            </Col>

        </Row>
    )
}
const Container = styled.div`
`
const Img = styled.div`
    overflow: hidden;
    height: 80px;
    width: 80px;
    border-radius: 10px;

    .img{
        display: block;
        height: 100%;
        width: 100%;
        object-fit: cover;

    }
`

