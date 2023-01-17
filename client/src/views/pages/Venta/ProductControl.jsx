import React, { Fragment, useState, useEffect } from 'react'
import style from './ProductControlStyle.module.scss'
import { getProducts, QueryByCategory, watchingUserState } from '../../../firebase/firebaseconfig.js'
import { Button, Product, Grid, ControlSearchProduct } from '../../'
import { useSelector } from "react-redux";
import { CustomProduct } from '../../templates/system/Product/CustomProduct'
import { selectIsRow } from '../../../features/setting/settingSlice';
import { Carrucel } from '../../component/Carrucel/Carrucel';

export const ProductControl = ({products, filteredProducts, searchData}) => {
    
    // const [products, setProducts] = useState([])
    // const [searchData, setSearchData] = useState('')
    // const [filteredProducts, setFilteredProducts] = useState([])
    const viewRowModeRef = useSelector(selectIsRow)
    
    const [userDisplayName, setUserDisplayName] = useState('')
    useEffect(() => {
        watchingUserState(setUserDisplayName)
    }, [])

    return (
        <Fragment>
            {/* <ControlSearchProduct searchData={searchData} setSearchData={setSearchData}></ControlSearchProduct> */}
            <Carrucel />
            <div className={[style.container]}>

                <div className={style.wrapper} >
                    {
                        searchData === '' && products.length > 0 ?
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

                            ) : (
                                <Grid columns='4'>
                                    {filteredProducts.map(({ product }, index) => (product.custom ?
                                        (
                                            <CustomProduct key={index} product={product}></CustomProduct>
                                        ) : (
                                            <Product
                                                key={index}
                                                view='row'
                                                product={product}>
                                            </Product>
                                        )
                                    ))
                                    }
                                </Grid>
                            )
                    }

                </div>
            </div>
        </Fragment>
    )
}
