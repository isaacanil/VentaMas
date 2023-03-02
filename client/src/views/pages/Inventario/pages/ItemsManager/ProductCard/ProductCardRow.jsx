import React from 'react'
import { IoMdTrash } from 'react-icons/io';
import { TbEdit } from 'react-icons/tb';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { handleDeleteProductAlert } from '../../../../../../features/Alert/AlertSlice';
import { openModalUpdateProd } from '../../../../../../features/modals/modalSlice';
import { ChangeProductData } from '../../../../../../features/updateProduct/updateProductSlice';
import { useFormatNumber } from '../../../../../../hooks/useFormatNumber';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';
import { Button, ButtonGroup } from '../../../../../templates/system/Button/Button';

export const ProductCardRow = ({ product, Col, Row }) => {
    const dispatch = useDispatch();
    const handleDeleteProduct = (id) => {
        dispatch(handleDeleteProductAlert(id));
      };
    
      const handleUpdateProduct = (product) => {
        dispatch(openModalUpdateProd());
        dispatch(ChangeProductData(product));
      };
    return (
        <Container>
            <Row>
                <Col>
                    <Img>
                        <img
                            src={product.productImageURL} alt=""
                            onError={({ currentTarget }) => {
                                currentTarget.onerror = null;
                                currentTarget.src = noImg;
                                currentTarget.style.objectFit = 'contain'
                            }} />
                    </Img>
                </Col>
                <Col>
                    <ProductName>
                        {product.productName}
                    </ProductName>
                </Col>
                <Col position='right'>
                    <Item position='right'>
                        <span>{useFormatNumber(product.stock)}</span>
                    </Item>
                </Col>
                <Col position='right'>
                    <Item position='right'>
                        <span>{useFormatPrice(product.cost.unit)}</span>
                    </Item>
                </Col>
                {/* <Item>
                    <span>Contenido Neto: {product.netContent}</span>
                </Item> */}
                <Col position='right'>
                    <Item position='right'>
                        <span>{useFormatPrice(product.tax.value * product.cost.unit)}</span>
                    </Item>
                </Col>
                <Col position='right'>
                    <Item position='right'>
                        <span>{useFormatPrice(product.price.unit)}</span>
                    </Item>
                </Col>
                <Head>
                    <ButtonGroup>
                        <Button
                            startIcon={<TbEdit />}
                            borderRadius='normal'
                            // variant='contained'
                            color={'gray-dark'}
                            width='icon32'
                            bgcolor='editar'
                            onClick={() => handleUpdateProduct(product)}
                        />
                        <Button
                            startIcon={<IoMdTrash />}
                            width='icon32'
                            color={'gray-dark'}
                            borderRadius='normal'
                            // bgcolor='error'
                            onClick={() => handleDeleteProduct(product.id)}
                        />
                    </ButtonGroup>
                </Head>
            </Row>
        </Container>
    )
}

const Container = styled.div`
 background-color: white;
 padding-right: 0.6em;
 padding-right: 0px;
`
const Head = styled.div`
   display: flex;
   align-items: center;

   justify-content: space-between;
   height: min-content;
`
const Img = styled.div`
  
    width: 100%;
    max-height: 2.75em;
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    border-radius: var(--border-radius-light);
    img{
        object-fit: cover;
        width: 100%;
        height: 100%;
    }
`
const Body = styled.div`
    display: grid;
    grid-template-columns: 
    minmax(200px, 1fr) //name
    minmax(100px, 0.4fr)  //cost
    minmax(100px, 0.4fr) //stock
    minmax(100px, 200px); //price
    align-items: center;
    gap: 1em;
    color: var(--Gray7);
    font-size: 14px;

`
const ProductName = styled.span`
    color: var(--Gray7);
        margin: 0;
        padding: 0;
        font-weight: 500;
        
    
`
const Group = styled.div`
    display: flex;
    justify-content: space-between;
`
const Item = styled.div`
    ${props => {
        switch (props.position) {
            case 'right':
                return `
                justify-self: end;
                `
            default:
                return `
                justify-self: start;
                `
        }
    }}
`