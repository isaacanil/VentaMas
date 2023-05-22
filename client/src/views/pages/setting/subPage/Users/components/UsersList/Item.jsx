import React from 'react'
import styled from 'styled-components'
import { Row } from '../../../../../../templates/system/Table/Row'
import { Button } from '../../../../../../templates/system/Button/Button'
import { icons } from '../../../../../../../constants/icons/icons'

export const Item = ({ data, num, colWidth }) => {
    console.log(colWidth)
    return (
        <Container onClick={() => console.log(data.user)}>
            <Row col={colWidth}>
                <Col>
                    {num + 1}
                </Col>
                <Col>
                    {data?.user?.name}
                </Col>
                <Col>
                    {data?.user?.rol?.label}
                </Col>
                <Col>
                    {data?.user?.active ? "Activo" : "inactivo"}
                </Col>
                <Col>
                    <Button width={'icon32'} color={'danger'} title={icons.operationModes.delete} />
                </Col>
            </Row>
        </Container>
    )
}


const Container = styled.div`
    height: 3em;
    width: 100%;
    padding: 0 1em;
    display: flex;
    align-items: center;
    font-size: 14px;
    :hover{
        background-color: var(--White2);
    }
`
const Col = styled.div`
width: 100%;
padding: 0 0.4em;
    ${(props) => {
    switch (props.text) {
      case 'right':
        return `
          text-align: right;
        `
      case 'left':
        return `
          text-align: left;
          `
      default:
        break;
    }
  }}
   ${(props) => {
    switch (props.align) {
      case 'right':
        return `
        display: flex;
        justify-content: flex-end;
          text-align: right;
        `
      case 'left':
        return `
          text-align: left;
          `
      default:
        break;
    }
  }}
`