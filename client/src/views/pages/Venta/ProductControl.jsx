import React, { Fragment, useState, useEffect } from 'react'
import style from './ProductControlStyle.module.scss'
import { getProducts, QueryByCategory, watchingUserState } from '../../../firebase/firebaseconfig.js'
import { Button, Product, Grid, ControlSearchProduct } from '../../'
import { SelectCategoryList, SelectCategoryStatus } from '../../../features/category/categorySlicer';
import { useSelector } from "react-redux";
import { CustomProduct } from '../../templates/system/Product/CustomProduct'
import { selectIsRow } from '../../../features/setting/settingSlice';
import { Carrucel } from '../../component/Carrucel/Carrucel';

export const ProductControl = () => {
    const [queryByCategoryList, setQueryByCategory] = useState([])
    const categoryStatus = useSelector(SelectCategoryStatus)
    const categoryArrayData = useSelector(SelectCategoryList)
    const [productsArray, setProductsArray] = useState([])
    const [products, setProducts] = useState([])
    const [searchData, setSearchData] = useState('')
    const [filteredProducts, setFilteredProducts] = useState([])
    const viewRowModeRef = useSelector(selectIsRow)
    useEffect(() => {
        if (categoryStatus) {
            QueryByCategory(setProducts, categoryArrayData, categoryStatus)
        }
        if (categoryStatus === false) {
            getProducts(setProducts)
        }
    }, [categoryArrayData, categoryStatus])
    useEffect(() => {
        const filtered = products.filter((e) => e.product.productName.toLowerCase().includes(searchData.toLowerCase()));
        setFilteredProducts(filtered)
    }, [searchData, products])
    const [userDisplayName, setUserDisplayName] = useState('')
    useEffect(() => {
        watchingUserState(setUserDisplayName)
    }, [])
    return (
        <Fragment>
            {/* <ControlSearchProduct searchData={searchData} setSearchData={setSearchData}></ControlSearchProduct> */}
            <Carrucel/>
            <div className={[style.container]}>

                <div className={style.wrapper} >
                    {
                        searchData === '' && products.length > 0 ?
                            (
                                <Grid columns='4' isRow={viewRowModeRef ? true : false} onScroll={(e) => e.currentTarget.style.scrollBehavior = 'smooth'}>
                                    {products.map(({ product }, index) => (
                                        product.custom ?
                                            (
                                                <CustomProduct key={index} product={product}></CustomProduct>
                                            ) : (
                                                <Product
                                                    key={index}
                                                    view='row'
                                                    product={product}>
                                                </Product>
                                            )

                                    ))}
                                </Grid>

                            ) : (
                                <Grid columns='4'>
                                    {filteredProducts.map(({ product }, index) => ( product.custom ?
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
