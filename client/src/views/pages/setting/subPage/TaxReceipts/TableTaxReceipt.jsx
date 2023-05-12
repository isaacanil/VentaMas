import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useCompareObjects } from '../../../../../hooks/useCompareObject';
import { Data } from './taxConfigTable'
import { UpdateObjectProperty } from './UpdateTaxReceipt';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../features/auth/userSlice';
export const TableTaxReceipt = ({ array, setData }) => {
  
  const updateTaxReceipt = (array, setArray, index, e, maxCharacters = false) => {
    let key = e.target.name
    let newValue = e.target.value

    newValue = String(newValue);

    if (newValue.length > 0 && maxCharacters) {
      newValue = newValue.slice(-maxCharacters);
      newValue = newValue.substring(0, maxCharacters);
      newValue = newValue.padStart(maxCharacters, "0")
    }

    const newArray = array.map(({ data }, i) => i === index ? { "data": { ...data, [key]: newValue } } : { data })
    setArray(newArray)
  }
  console.log(array, 'array')

  return (
    <Container>
      <Row>
        {
          Data().settingDataTaxTable.map((item, index) => (
            <Col key={index}><h4>{item.name}</h4></Col>
          ))
        }
      </Row>
      {array ? (
        array.map(({ data }, index) => (
          data &&
          <Row key={index}>
            <Col>
              <input
                type="text"
                value={data?.name}
                name='name'
                onChange={(e) => updateTaxReceipt(array, setData, index, e)}
              />
            </Col>
            <Col>
              <input
                type="text"
                value={data?.type}
                name='type'
                onChange={(e) => updateTaxReceipt(array, setData, index, e)}
              />

            </Col>
            <Col>
              <input
                type="number"
                value={data?.serie}
                name='serie'
                onChange={(e) => updateTaxReceipt(array, setData, index, e, 2)}
              />
            </Col>
            <Col>
              <input
                type="number"
                value={data?.sequence}
                name='sequence'
                onChange={(e) => updateTaxReceipt(array, setData, index, e, 10)}
              />
            </Col>
            <Col>
              <input
                type="number"
                name='increase'
                value={data?.increase}
                onChange={(e) => updateTaxReceipt(array, setData, index, e)}
              />
            </Col>
            <Col>
              <input
                type="number"
                name='quantity'
                value={data?.quantity}
                onChange={(e) => updateTaxReceipt(array, setData, index, e)}
              />
            </Col>
          </Row>
        ))
      ) : null}

    </Container>
  )
}
const Container = styled.div`
        border: 1px solid var(--Gray1);
        border-radius: 10px;
        overflow: hidden;
`
const Row = styled.div`
display: grid;
align-items: center;
grid-template-columns: minmax(150px, 0.7fr) minmax(60px, 0.4fr) minmax(52px, 0.4fr) minmax(90px, 0.8fr) minmax(100px, 0.5fr) minmax(85px, 0.4fr);
border-bottom: 1px solid var(--Gray1);
height: 2em;
    :last-child{
        border-bottom:0px;
    }
`
const Col = styled.div`
height: 100%;
padding: 0 0.6em;
display: flex;
align-items: center;
:last-child{
    border-right: 0;
}
:first-child{
    border-left: 0;
}
border-right: 1px solid var(--Gray1);
input[type="text"],input[type="number"]{
    width: 100%;
    height: 100%;
    border: 0;
    font-size: 12px;
    padding: 0;
    :focus{
        outline: none;
    }
}
input[type='number']::-webkit-inner-spin-button, 
input[type='number']::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
}
h4{
    font-size: 12px;
    width: 100%;
    text-align: left;
    margin: none;
    padding: 0 0 !important;
}
h5{
    font-weight: 500;
}
`