import React, { Fragment, useEffect, useState } from 'react'
import style from './ControlSearchProductStyle.module.scss'
import { Product, Grid } from '../../'

export const SearchList = ({dataSearch}) => {
  
  const [products, setProduct] = useState()
  const [filteredProducts, setFilteredProducts] = useState([])
  console.log(dataSearch)

  //console.log(auth.currentUser)
    useEffect(()=>{
        const filtered = products.filter((e) => e.product.productName.toLowerCase().includes(dataSearch.toLowerCase()));
        setFilteredProducts(filtered)
    }, [dataSearch, products])
  
    
 


  return (
    <div className={style.container}>
      <Grid columns='4'>
      {
        !dataSearch == '' ? (
          products.length > 0 ? filteredProducts.map(({product}, index) => (

           <Product 
           key={index} 
           image={product.productImageURL}
           title={product.productName} 
           price={product.totalPrice}
           view="row"  
           product={product}
           ></Product>
              
           
          ))  : <h2>No hay Productos!</h2>
      ) : (
      null
      )
      }
      </Grid>

    </div >
  )
}

