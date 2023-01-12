import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useCompareObjects } from '../../../../../hooks/useCompareObject';
import { Data } from './taxConfigTable'
import { UpdateObjectProperty } from './UpdateTaxReceipt';
export const TableTaxReceipt = ({ data, setData }) => {
  
    const updateTaxReceipt = (array, setArray, index, key, newValue, dataType, maxCharacters = null) => {
        switch (dataType) {
          case 'string':
            newValue = String(newValue);
            break;
          case 'number':
            newValue = Number(newValue);
            break;
          default:
            break;
        }
        if (newValue.length > 0 && maxCharacters !== null) {
          newValue = newValue.slice(-maxCharacters);
          newValue = newValue.substring(0, maxCharacters);
          newValue = newValue.padStart(maxCharacters, "0")
        }
        const newArray = array.map((item, i) => i === index ? {...item, [key]: newValue} : item)
        setArray(newArray)
      }
      console.log(data, '..........................data')
    return (
        <Container>
            <Row>
                {
                    Data().settingDataTaxTable.map((item, index) => (
                        <Col key={index}><h4>{item.name}</h4></Col>
                    ))
                }
            </Row>
            {data ? (
                 data.map((item, index) => (
                    <Row key={index}>
                      <Col>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateTaxReceipt(data, setData, index, 'name', e.target.value, 'string')}
                        />
                      </Col>
                      <Col>
                        <input
                          type="text"
                          value={item.type}
                          onChange={(e) => updateTaxReceipt(data, setData, index, 'type', e.target.value, 'string')}
                        />
        
                      </Col>
                      <Col>
                        <input
                          type="number"
                          value={item.serie}
                          onChange={(e) => updateTaxReceipt(data, setData, index, 'serie', e.target.value, 'string', 2)}
                        />
                      </Col>
                      <Col>
                        <input
                          type="number"
                          value={item.sequence}
                          onChange={(e) => updateTaxReceipt(data, setData, index, 'sequence', e.target.value, 'string', 10)}
                        />
                      </Col>
                      <Col>
                        <input
                          type="number"
                          value={item.increase}
                          onChange={(e) => updateTaxReceipt(data, setData, index, 'increase', e.target.value, 'string')}
                        />
                      </Col>
                      <Col>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateTaxReceipt(data, setData, index, 'quantity', e.target.value, 'string')}
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
grid-template-columns: minmax(150px, 0.7fr) minmax(80px, 0.4fr) minmax(55px, 0.4fr) minmax(110px, 0.9fr) minmax(100px, 0.5fr) minmax(80px, 0.4fr);
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
    :focus{
        outline: none;
    }
}
h4{
    font-size: 12px;
    margin: 0;
    padding: 0;
}
h5{
    font-weight: 500;
}
`