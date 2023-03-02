import React from 'react'


import { useEffect, useState } from 'react';
import styled from 'styled-components'
import { Button } from '../../../index';
import { useDispatch, useSelector } from 'react-redux';
import { handleModalSetCustomPizza } from '../../../../features/modals/modalSlice'
import { addProduct, totalShoppingItems } from '../../../../features/cart/cartSlice';
import { SelectProduct } from '../../../../features/cart/cartSlice';
import { separator } from '../../../../hooks/separator';
import { selectImageHidden } from '../../../../features/setting/settingSlice';
import { FaPizzaSlice } from 'react-icons/fa';

export const CustomProduct = ({ product }) => {
    //const [productList, setProductList] = useState([])
    const dispatch = useDispatch();
    const ProductSelected = useSelector(SelectProduct);
    const imageHiddenRef = useSelector(selectImageHidden)
    const handleGetThisProduct = (product) => dispatch(handleModalSetCustomPizza());
    return (
        <ProductContainer  onClick={() => handleGetThisProduct(product)} imageHiddenRef={imageHiddenRef ? true : false}>
            <ProductImgWrapper imageHiddenRef={imageHiddenRef ? true : false}>
                <span>
                    {/* {product.productName.charAt(0)} */}
                    {<FaPizzaSlice/>}
               
                </span>
            </ProductImgWrapper>
            <Body>
                <Main>
                    <Title>{product.productName}</Title>
                </Main>
                <Footer>
                </Footer>
            </Body>
        </ProductContainer>
    )
}
const ProductContainer = styled.div`
    order: -2;
    //border: 1px solid rgba(0, 0, 0, 0.200);
    //box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.100);
    border-radius: 6px;
    background-color: rgb(255, 255, 255);
    overflow: hidden;
    display: grid;
    gap: 10px;
    grid-template-columns: min-content 1fr;
    transition: 400ms all ease-in-out;
    align-items: center;
    align-content: center;
    ${(props) => {
        switch (props.imageHiddenRef) {
            case true:
                return `
                    height: 60px;
                `

            case false:
                return `
                    height: 80px;
                `

            default:
                break;
        }
    }
    }
   
${(props) => {
        switch (props.container) {
            case "row":
                return `
                grid-template-columns: min-content 1fr;
                height: 80px;
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
    display: flex;
    padding: 4px;
    justify-content: center;
    align-items: center;
    ${(props) => {
        switch (props.imageHiddenRef) {
            case false:
                return`
                height: 80px;
                width: 80px;
                transition: all 400ms ease-in-out;
                span{
                    width: 100%;
                    height: 100%;
                    font-size: 2.2em;
                }
                `
                case true:
                    return`
                    height: 60px;
                    span{
                        width: 60px;
                        font-size: 2em;
                    }
                    
                `
            default:
                break;
        }  
    }}
    span{
        display: flex;
        justify-content: center;
        align-items: center;
        height: 80px;
        width: 80px;
        font-weight: 700;
        height: 100%;
        color: rgba(0, 0, 0, 0.200);
        background-color: var(--White3);
        border-radius: 7px;
    }
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
const Body = styled.div`
     height: 100%;
    width: 100%;
    background-color: #ffffff;
    padding: 4px 0;
    position: relative;
    transition: 4000ms all ease-in-out;
    `
const Main = styled.div`
   
`
const Title = styled.h5`
    color: var(--Gray6);
    width: 100%;
    font-size: 13.5px;
    line-height: 1pc;
    padding: 0 1em;
    padding-top: 0.4em;
    padding-right: 2em;
    display: -webkit-box;
    font-weight: 600;
    letter-spacing: 0.2px;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;  
    //white-space: nowrap;
    text-transform: capitalize;
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
    width: 100%;
    bottom: 0;
    right: 0;
    text-align: right;
    position: absolute;

    background-color: #d8d8d8;
    font-weight: 500;
    padding: 0.2em 1.5em 0.2em 0;
    border-top-left-radius: 10px;
    color: #424242;
    
    //border-radius: 50px;
    
`