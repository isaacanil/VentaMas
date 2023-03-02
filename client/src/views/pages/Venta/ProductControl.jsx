import React, { Fragment, useState, useEffect } from 'react'
import style from './ProductControlStyle.module.scss'
import { watchingUserState } from '../../../firebase/firebaseconfig.jsx'
import { Button, Product, Grid, ControlSearchProduct } from '../../'
import { useSelector } from "react-redux";
import { CustomProduct } from '../../templates/system/Product/CustomProduct'
import { selectIsRow } from '../../../features/setting/settingSlice';
import { Carrucel } from '../../component/Carrucel/Carrucel';

export const ProductControl = ({ products }) => {
    const viewRowModeRef = useSelector(selectIsRow)
    return (
        <Fragment>
            {/* <ControlSearchProduct searchData={searchData} setSearchData={setSearchData}></ControlSearchProduct> */}
            <Carrucel />
            <div className={[style.container]}>
                <div className={style.wrapper} >
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

                </div>
            </div>
        </Fragment>
    )
}
