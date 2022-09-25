import React, { Fragment, useState, useEffect } from 'react'
import style from './ProductControlStyle.module.scss'
import { getProducts, query, addDoc, collection, db, getDocs, auth, onAuthStateChanged } from '../../../firebase/firebaseconfig'
import { Button, Product, Grid, ControlSearchProduct } from '../../'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { v4 } from 'uuid'
import { SearchList } from '../../component/ControlSearchProduct/SearchList'
export const ProductControl = () => {
    const [products, setProducts] = useState('')
    const [searchData, setSearchData] = useState('')
    const [categoryData, setCategoryData] = useState('')
//Products 
    useEffect(() => {
        getProducts(setProducts)
    }, []);
    const [userDisplayName, setUserDisplayName] = useState('')
    useEffect(() => {
        onAuthStateChanged(auth, (userAuth) => {
            if (userAuth) {
                userAuth
                setUserDisplayName(userAuth)

            }
        })
    }, [])
    const [categorySelected, setCategorySelected] = useState('')

    return (
        <Fragment>
        <ControlSearchProduct searchData={searchData} setSearchData={setSearchData}></ControlSearchProduct>
        <div className={style.component_container}>
            {
                searchData === '' || categoryData === '' ? (
                    products.length !== 0 ?
                    (
                        <Grid columns='4'>
                            {products.map(({ product, id }, index) => (    
                                    <Product 
                                    key={index} 
                                    title={product.productName} 
                                    image={product.productImageURL} 
                                    price={product.price.unit}
                                    view='row' 
                                    product={product}>
                                    </Product>
                            ))
                            }
                        </Grid>

                    ) : (
                        <h2>no tenemos</h2>
                    )
                ) : <SearchList dataSearch={searchData}></SearchList>

                
               
            }
        </div>
        </Fragment>
    )
}
