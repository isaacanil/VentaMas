import React, { Fragment, useState, useEffect } from 'react'
import { Product, Grid } from '../../'
import { useSelector } from "react-redux";
import { CustomProduct } from '../../templates/system/Product/CustomProduct'
import { selectIsRow } from '../../../features/setting/settingSlice';
import { Carrusel } from '../../component/Carrusel/Carrusel';
import styled from 'styled-components';

export const ProductControl = ({ products, isProductGrouped }) => {
    const viewRowModeRef = useSelector(selectIsRow)
    if (isProductGrouped) {
      // Agrupar los productos por categoría
      const productsByCategory = products.reduce((result, { product }) => {
        const category = product.category
        if (!result[category]) {
          result[category] = []
        }
        result[category].push(product)
        return result
      }, {})
  
      return (
        <Fragment>
        
          <Carrusel />
          <Container>
            <Wrapper>
              {
                Object.keys(productsByCategory)
                .sort((a, b) => a < b ? 1 : -1)
                .map((category) => (
                  <CategoryGroup key={category}>
                    <h2>{category}</h2>
                    <Grid padding='bottom' columns='4' isRow={viewRowModeRef ? true : false} onScroll={(e) => e.currentTarget.style.scrollBehavior = 'smooth'}>
                      {productsByCategory[category].map((product, index) => (
                        product.custom ?
                          (
                            <CustomProduct key={index} product={product}></CustomProduct>
                          ) : (
                            <Product
                              key={index}
                              view='row'
                              product={product}
                            />
                          )
                      ))}
                    </Grid>
                  </CategoryGroup>
                ))
              }
            </Wrapper>
          </Container>
        </Fragment>
      )
    } else {
      return (
        <Fragment>
          <Carrusel />
          <Container>
            <Wrapper>
              {
                products.length > 0 ?
                  (
                    <Grid padding='bottom' columns='4' isRow={viewRowModeRef ? true : false} onScroll={(e) => e.currentTarget.style.scrollBehavior = 'smooth'}>
                      {products.map(({ product }, index) => (
                        product.custom ?
                          (
                            <CustomProduct key={index} product={product}></CustomProduct>
                          ) : (
                            <Product
                              key={index}
                              view='row'
                              product={product}
                            />
                          )
                      ))}
                    </Grid>
                  ) : null
              }
            </Wrapper>
          </Container>
        </Fragment>
      )
    }
  }
  

const Container = styled.div`
height: 100%;
background-color: var(--color2);
overflow: hidden;
border-radius: var(--border-radius-light);
border-top-left-radius: 0;
border-bottom-right-radius: 0;
border-bottom-left-radius: 0;
`
const Wrapper = styled.div`
 height: 100%;
 padding: 0.5em;
 //padding-top: 1em;
 overflow: auto;
`
const CategoryGroup = styled.div`
:first-child{
    margin-top: 0;

}
margin-bottom: 2em;
    h2{
        font-size: 1.15em;
        font-weight: 550;
        color: var(--Gray8);
        
    }
`