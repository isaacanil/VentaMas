import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { InputText } from '../../templates/system/Inputs/Input'
import { IoClose } from 'react-icons/io5'
import { ProductCard } from './ProductCard'
import { SelectProductSelected } from '../../../features/addOrder/addOrderModalSlice'
import { useGetProducts } from '../../../firebase/products/fbGetProducts'
import { useClickOutSide } from '../../../hooks/useClickOutSide'
export const ProductFilter = ({ productName, isOpen, setIsOpen, handleSelectProduct }) => {
  
  const [value, setValue] = useState(undefined)
  const close = () => {
    setIsOpen(false)
  }
  const productListRef = useRef(null);

  const {products} =  useGetProducts(true);
  const productsWithStockTracking = products.filter(({product}) => product.trackInventory === true ) || [];
 
  useEffect(() => {
    if (!productName) {
      setValue('')
    }
    if (productName) {
      console.log(productName)
      setValue(productName)
    }
  }, [productName])

  useClickOutSide(productListRef, isOpen, close);

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
        <ProductsList ref={productListRef}>
          <ProductsListHead>
            <span>Lista de Productos Inventariables</span>
            <span>
              <Button onClick={close}>
                <IoClose />
              </Button>
            </span>
          </ProductsListHead>
          <ProductsListBody>
            {
              productsWithStockTracking.map((data, index) => (
                <ProductCard
                  fn={handleSelectProduct}
                  key={index}
                  data={data}
                  close={close}
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
  height: calc(100vh - 16em);
  max-width: 1000px;
  width: 100%;
  
  position: absolute;
  z-index: 9999;
  top: 2.8em;
  
  margin: 0 auto;
  box-shadow: 2px 10px 10px rgba(0, 0, 0, 0.400);
  border: var(--border-primary);
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