
import { useEffect, useState } from 'react';
import styled from 'styled-components'
import { Button } from '../../../index';
import { useDispatch, useSelector } from 'react-redux';
import { addProduct } from '../../../../features/cart/cartSlice';
import { SelectProduct } from '../../../../features/cart/cartSlice';
import { separator } from '../../../../hooks/separator';
const ProductContainer = styled.div`
    border: 1px solid rgba(0, 0, 0, 0.300);
   
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.220);
    border-radius: 6px;
    background-color: rgb(255, 255, 255);
    overflow: hidden;
    display: grid;
    gap: 1em;
    align-items: center;
    align-content: center;
    
${(props) => {
        switch (props.container) {
            case "row":
                return `
                grid-template-columns: min-content 1fr;
                height: 100px;
                overflow: hidden;
                
                `;
           
            default:
                return `
            
          `
        }
    }}
`;
const ProductImgWrapper = styled.div`
 
    overflow: hidden;
;
    ${(props) => {
        switch (props.type) {
            case "row":
                return `
                
                height: 100px;
                width: 100px;
           

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
    height: 100%;
  
    overflow: hidden;
    object-fit: cover;

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
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    grid-template-columns: min-content;
    grid-template-rows: min-content min-content;
    
    
    
    `
const Main = styled.div`
    padding: 0.6em 0.4em 0;
    
`
const Title = styled.h5`
    color: rgb(66, 66, 66);
    width: 165px;
    line-height: 1pc;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;  
    //white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`
const ProductStock = styled.div`
    height: 50px;
    width: 50px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
  
`
const Footer = styled.footer`

`
const couter = styled.div`
`
const ProductPrice = styled.div`
    height: auto;
    background-color: #d8d8d8;
    font-weight: 500;
    padding: 0.2em 0.8em;
    border-top-left-radius: 10px;
    color: #424242;
    //border-radius: 50px;
    
    
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



    return (

        <ProductContainer container='row' onClick={() => handleGetThisProduct(product)}>
            <ProductImgWrapper type='row'>
                <ProductImg type='row' src={image} row></ProductImg>
            </ProductImgWrapper>
            <Body type='row'>
                <Main>
                    <Title>{title}</Title>

                </Main>
                <Footer>
                    <ProductPrice>
                        <span>
                            RD${separator(price)}
                        </span>
                    </ProductPrice>

                </Footer>
            </Body>
        </ProductContainer>

    )



}
