import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { InputText } from '../../../../templates/system/Inputs/Input'
import { IoClose } from 'react-icons/io5'
import { getProducts } from '../../../../../firebase/firebaseconfig'
import { ProductCard } from './ProductCard'
import { SelectProductSelected } from '../../../../../features/addOrder/addOrderModalSlice'
export const ProductFilter = ({ productName, isOpen, setIsOpen }) => {

  const [products, setProducts] = useState([])
  const [value, setValue] = useState(undefined)
  
  useEffect(() => {
    getProducts(setProducts, true)
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
        border
        value={value}
        placeholder='Buscar...'
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsOpen(true)}
        bgColor='gray-light'
      />
      {isOpen ? (
        <ProductsList>
          <ProductsListHead>
            <span>Lista de Producto</span>
            <span>
              <Button onClick={() => setIsOpen(false)}>
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
                  setShowProductList={setIsOpen}
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
  max-width: 1000px;
  height: calc(100vh - 2.75em - 2.75em - 7.7em);
  width: calc(100% + 2em);
  border: var(--border-primary);
  position: absolute;
  top: 2.8em;
  left: -1em;
  right: -1em;
  box-shadow: 2px 10px 10px rgba(0, 0, 0, 0.400);
  border-radius: 08px;
  overflow: hidden;
  display: grid;
  
  grid-template-rows: min-content 1fr;
  background-color: #b4c4ce;
  
`
const ProductsListHead = styled.div`
 background-color: var(--White3);
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
 display: grid;
 grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
 align-items: flex-start;
 align-content: flex-start;
 background-color: var(--White3);
 gap: 0.4em;
 padding: 0.3em;

  
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