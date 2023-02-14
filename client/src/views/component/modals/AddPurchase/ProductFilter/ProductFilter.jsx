import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { InputText } from '../../../../templates/system/Inputs/Input'
import { IoClose } from 'react-icons/io5'
import { getProducts } from '../../../../../firebase/firebaseconfig'
import { ProductCard } from './productCard'
import { SelectProductSelected } from '../../../../../features/addOrder/addOrderModalSlice'
export const ProductFilter = ({ productName }) => {

  const [products, setProducts] = useState([])
  const [value, setValue] = useState(undefined)
  const [showProductList, setShowProductList] = useState(false)
  useEffect(() => {
    getProducts(setProducts)
  }, [])
useEffect(()=>{
  if(!productName){
    setValue('')
  }
  if(productName){
    console.log(productName)
    setValue(productName)
  }
},[productName])
  return (
    <Component>
      <InputText
        size='small'
        value={value}
        placeholder='Buscar...'
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setShowProductList(true)}
      />
      {showProductList ? (
        <ProductsList>
          <ProductsListHead>
            <span>Lista de Producto</span>
            <span>
              <Button onClick={() => setShowProductList(false)}>
                <IoClose />
              </Button>
            </span>
          </ProductsListHead>
          <ProductsListBody>
            {
              products.map((data, index) => (
                <ProductCard
                  key={index}
                  data={data}
                  showProductList={showProductList}

                />
              ))
            }
          </ProductsListBody>
        </ProductsList>
      ) : null}
    </Component>
  )
}
const Component = styled.div`
  display: block;
  z-index: 1;
`
const ProductsList = styled.div`
  max-width: 300px;
  height: calc(200px - 2.75em);
  width: 100%;
  border: 1px solid  #00000081;
  position: absolute;
  top: 2.8em;
  box-shadow: 2px 10px 10px rgba(0, 0, 0, 0.400);
  border-radius: 08px;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
  background-color: #b4c4ce;
  
`
const ProductsListHead = styled.div`
height: 2.2em;
display: flex;
align-items: center;

padding: 0 0.4em;
display: flex;
justify-content: space-between;
`
const ProductsListBody = styled.div`
 
  overflow-y: scroll;
 // background-color: #f0f0f0;

  
`
const Button = styled.button`
  width: 1.2em;
  height: 1.2em;
  display: flex;
  align-items: center;

  justify-content: center;
  padding: 0;
  font-size: 1.05em;
  border-radius: 100%;
  &:focus {
    outline: none;
  }
`