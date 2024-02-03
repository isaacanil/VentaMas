import * as antd from 'antd'
const { Button, Input, Form } = antd
import React from 'react'
import styled from 'styled-components'
import { icons } from '../../../../../../../../constants/icons/icons'
import { changeAmountToBuyProduct } from '../../../../../../../../features/invoice/invoiceFormSlice'
import { useDispatch } from 'react-redux'
export const Product = ({ product, index, invoice }) => {

  const dispatch = useDispatch()
  const increase = () => {
    console.log("increase")
    dispatch(changeAmountToBuyProduct({ product, type: "add" }))
  }
  const decrease = () => {
    dispatch(changeAmountToBuyProduct({ product, type: "subtract" }))
  }
  function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }
  const onChange = (value) => {
    console.log(value)
    value = Number(value)
    if (!isValidNumber(value)) return
    dispatch(changeAmountToBuyProduct({ product, amount: value, type: "change" }))
  }
  return (
    <Container>
      <Header>
        {product?.productName}
      </Header>
      <Body>
        <div>
          {product?.amountToBuy?.total} x {product?.price?.unit} = {product?.price?.total}
        </div>
        <Counter>
          <Button
            onClick={decrease}
            icon={icons.mathOperations.subtract}
          />
          <Input
            value={product.amountToBuy.total}

            onChange={(value) => onChange(value.target.value)}
          />
          <Button
            icon={icons.operationModes.add}
            onClick={increase}
          />
        </Counter>
      </Body>
    </Container>
  )
}
const Container = styled.div`
 display: grid;
  gap: 1em;
  grid-template-columns: minmax(100px, 200px) min-content;
`
const Header = styled.div`
  
`
const Body = styled.div`
  
`
const Counter = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: 2em 80px 2em;
`