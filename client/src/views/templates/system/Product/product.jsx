
import { useEffect, useState } from 'react';
import styled from 'styled-components'
import { Button } from '../../../index';
import { useDispatch, useSelector } from 'react-redux';
import { addProduct } from '../../../../features/cart/cartSlice';
import { SelectProduct } from '../../../../features/cart/cartSlice';

const ProductContainer = styled.div`

border: 1px solid #00000028;
padding: 0.8em;
border-radius: 6px;
background-color: rgb(255, 255, 255);
overflow: hidden;


${(props) => {
        switch (props.container) {
            case "row":
                return `
                grid-template-columns:  1fr;
                height: 100px;
                overlow: hidden;
                display: flex;
                align-items: center;
                justify-content: space-between;

                `;
            case "normal":
                return `

                `;
            default:
                return `
            
          `
        }
    }}
`;
const ProductImgWrapper = styled.div`
    border-radius: 6px;
    overflow: hidden;
    ${(props) => {
        switch (props.type) {
            case "row":
                return `
              position: relative;
                height: 100%;
           

                `;
            case "normal":
                return `

                `;
            default:
                return `
            
          `
        }
    }}
    
`;
const ProductImg = styled.img`
    src: url(${props => props.src});
    width: 100%;
    overflow: hidden;

    ${(props) => {
        switch (props.type) {
            case "row":
                return `
             
                height: 100%;

           

                `;
            case "normal":
                return `

                `;
            default:
                return `
            
          `
        }
    }}
`
const Body = styled.div`
     ${(props) => {
        switch (props.type) {
            case "row":
                return `
             display: flex;
             gap: 1em;

                `;
            case "normal":
                return `

                `;
            default:
                return `
            
          `
        }
    }}
`
const Title = styled.h5`
    color: black;
`
const ProductStock = styled.div`
    height: 50px;
    width: 50px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
  
`
const couter = styled.div`
`
const ProductPrice = styled.div`
    
`
export const Product = ({ title, image, view, price, product }) => {
    //const [productList, setProductList] = useState([])
    const dispatch = useDispatch();
    const ProductSelected = useSelector(SelectProduct);
    //console.log()
    //ProductSelected.map(productLocal => productLocal.productName)
    //const ProductFromFirebase = product;
    
    const handleGetThisProduct = (product) => {
            dispatch(
                addProduct(
                   product
                )

            )
            
        
        //console.log(ProductSelected)
        
    }
    
  
    if (view === 'row') {
        return (

            <ProductContainer container='row' onClick={() => handleGetThisProduct(product)}>
                <ProductImgWrapper type='row'>
                    <ProductImg type='row' src={image} row></ProductImg>
                </ProductImgWrapper>
                <Body type='row'>
                    <Title>{title}</Title>
                    <ProductPrice>RD${price}</ProductPrice>
                
                </Body>
             
                
            </ProductContainer>

        )
    }
    if (view === 'normal') {

        return (

            <ProductContainer onClick={() => handleGetThisProduct(product)}>

                <ProductImgWrapper>
                    <ProductImg src={image}></ProductImg>
                </ProductImgWrapper>
                <Body>
                    <Title>{title}</Title>
                   
                    <ProductPrice>RD${price}</ProductPrice>
                 
                </Body>
               
                
                
            </ProductContainer>

        )
    }

}
