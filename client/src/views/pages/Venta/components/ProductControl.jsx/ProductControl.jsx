import React, { Fragment, useState, useEffect, useRef } from 'react'
import { Product, Grid } from '../../../..'
import { useDispatch, useSelector } from "react-redux";
import { CustomProduct } from '../../../../templates/system/Product/CustomProduct'
import { selectIsRow } from '../../../../../features/setting/settingSlice';
import { Carrusel } from '../../../../component/Carrusel/Carrusel';
import styled from 'styled-components';
import Loader from '../../../../templates/system/loader/Loader';
import useScroll from '../../../../../hooks/useScroll';
import { CenteredText } from '../../../../templates/system/CentredText';
import { motion } from 'framer-motion';
import { icons } from '../../../../../constants/icons/icons';
import { openModalUpdateProd } from '../../../../../features/modals/modalSlice';
import { OPERATION_MODES } from '../../../../../constants/modes';
import { ChangeProductData } from '../../../../../features/updateProduct/updateProductSlice';
import { useNavigate } from 'react-router-dom';
import findRouteByName from '../../../../templates/MenuApp/findRouteByName';
import ROUTES_NAME from '../../../../../routes/routesName';
import { CategoriesGrouped } from '../CategoriesProductsGrouped/CategoriesGrouped';

export const ProductControl = ({ products, isProductGrouped, productsLoading, setProductsLoading }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

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


  const handlerProducts = () => {
    const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM
    navigate(INVENTORY_ITEMS);
  }
  const containerVariants = {
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
  return (
    <Fragment>
      <Carrusel />
      <Container>
        <Wrapper ref={productsContainerRef} isScrolled={isScrolled}>
          <Loader useRedux={false} show={productsLoading} message={loadingMessage} theme={'light'} />
          {
            productsLoading ? null : (
              isProductGrouped ? (
                <CategoriesGrouped
                  productsByCategory={productsByCategory}
                  viewRowModeRef={viewRowModeRef}
                />
              ) : (
                products.length > 0 ?
                  (
                    <Grid
                      padding='bottom'
                      columns='4'
                      isRow={viewRowModeRef ? true : false}
                      onScroll={(e) => e.currentTarget.style.scrollBehavior = 'smooth'}
                      variants={containerVariants}
                    >
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
                buttonText={'Gestionar Productos'}
                handleAction={handlerProducts}
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
