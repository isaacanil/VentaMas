import React, { Fragment, useState, useEffect, useRef } from 'react'
import { Product, Grid } from '../../'
import { useDispatch, useSelector } from "react-redux";
import { CustomProduct } from '../../templates/system/Product/CustomProduct'
import { selectIsRow } from '../../../features/setting/settingSlice';
import { Carrusel } from '../../component/Carrusel/Carrusel';
import styled from 'styled-components';
import Loader from '../../templates/system/loader/Loader';
import useScroll from '../../../hooks/useScroll';
import { CenteredText } from '../../templates/system/CentredText';
import { motion } from 'framer-motion';
import { icons } from '../../../constants/icons/icons';
import { openModalUpdateProd } from '../../../features/modals/modalSlice';
import { OPERATION_MODES } from '../../../constants/modes';
import { ChangeProductData } from '../../../features/updateProduct/updateProductSlice';

export const ProductControl = ({ products, isProductGrouped, productsLoading, setProductsLoading }) => {
  const dispatch = useDispatch()
  
  const viewRowModeRef = useSelector(selectIsRow)
  const loadingMessage = 'Cargando los Productos'
  const productsContainerRef = useRef(null);
  const isScrolled = useScroll(productsContainerRef);

  // Agrupar los productos por categoría
  const productsByCategory = products.reduce((result, { product }) => {
    const category = product.category
    if (!result[category]) { result[category] = [] }
    result[category].push(product)
    return result
  }, {})


  useEffect(() => {
    setProductsLoading(true)
    setTimeout(() => {
      setProductsLoading(false)
    }
      , 1000)
  }, [isProductGrouped])

  const effectProductContainer = {
    hidden: { opacity: 1, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }
  const handlerProductModal = () => {
    dispatch(openModalUpdateProd());
    dispatch(ChangeProductData({ products, status: OPERATION_MODES.CREATE.label }));

}
  return (
    <Fragment>
      <Carrusel />
      <Container>
        <Wrapper ref={productsContainerRef} isScrolled={isScrolled}>
          <Loader useRedux={false} show={productsLoading} message={loadingMessage} theme={'light'} />
          {
            productsLoading ? null : (
              isProductGrouped ? (
                Object.keys(productsByCategory)
                  .sort((a, b) => a < b ? 1 : -1)
                  .map((category) => (
                    <CategoryGroup key={category}>
                      <h2>{category}</h2>
                      <Grid
                        padding='bottom'
                        columns='4'
                        isRow={viewRowModeRef ? true : false}
                        onScroll={(e) => e.currentTarget.style.scrollBehavior = 'smooth'}
                        variants={effectProductContainer}
                      >
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
              ) : (
                products.length > 0 ?
                  (
                    <Grid padding='bottom' columns='4' isRow={viewRowModeRef ? true : false} onScroll={(e) => e.currentTarget.style.scrollBehavior = 'smooth'}>
                      {products.map(({ product }, index) => (
                        product.custom ?
                          (
                            <CustomProduct key={index} product={product} />
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
              )
            )
          }
          {
            (products.length === 0 || Object.keys(productsByCategory).length === 0) && !productsLoading ? (
              <CenteredText
                text='No hay Productos'
                buttonText={'Crear Producto'}
                handleAction={handlerProductModal}
                startIcon={icons.operationModes.add}
              />
            ) : null
          }
        </Wrapper>
      </Container>
    </Fragment>
  )
}


const Container = styled.div`
height: 100%;
background-color: var(--color2);
overflow: hidden;
border-radius: var(--border-radius-light);
border-top-left-radius: 0;
border-bottom-right-radius: 0;
border-bottom-left-radius: 0;
  position: relative;
`
const Wrapper = styled(motion.div)`
 height: 100%;
 padding: 0.5em;
  width: 100%;
  position: relative;
 //padding-top: 1em;
 overflow-y: scroll;

 
 ${({ isScrolled }) => isScrolled ? `
    border-top: 1px solid #e0e0e08b;
    box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);
    border-radius: var(--border-radius-light);
    
   
    ` : null
  }
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