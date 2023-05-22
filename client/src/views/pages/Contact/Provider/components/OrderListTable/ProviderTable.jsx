import React, { useState } from 'react'
import styled from 'styled-components'

import { useEffect } from 'react'
import { ProviderCard } from '../../ListItem/ProviderCard'
import { useSelector } from 'react-redux'
import { fbGetProviders } from '../../../../../../firebase/provider/fbGetProvider'
import { selectUser } from '../../../../../../features/auth/userSlice'

export const ProviderTable = () => {
  const [providers, setProviders] = useState([])
  const user = useSelector(selectUser)
  useEffect(() => { fbGetProviders(setProviders, user) }, [user])
  
  return (
    <Container>
      <Body>
        <TitleContainer>
          <h3>Administrar Proveedores</h3>
        </TitleContainer>
        <Table>
          <Row fill='fill'>
            <Col>#</Col>
            <Col>Nombre</Col>
            <Col>Teléfono</Col>
            <Col>Dirección</Col>
            <Col>Acción</Col>
          </Row>

          <TableBody>
            {
              Array(providers).length > 0 ? (
                providers.map(({provider}, index) => (
                  <ProviderCard Row={Row} Col={Col} key={index} e={provider} index={index} />
                ))
              ) : null

            }
          </TableBody>
        </Table>
      </Body>
    </Container>

  )
}
const Container = styled.div`
    width: 100%;
    padding: 0 1em;
    display: flex;
    justify-content: center;
`
const Body = styled.header`
    justify-self: center;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 10px;
    position: relative;
    height: calc(100vh - 2.75em - 2.5em - 1.5em);
    overflow: hidden;
    //max-height: 400px;
    width: 100%;
    max-width: 1000px;
    
    display: grid;
    grid-template-rows: min-content 1fr; 
    background-color: #ffffff;
    @media (max-width: 800px){
      max-height: 100%;
      
  }
`
const Table = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  overflow-x: auto;
  display: grid;
  grid-template-rows: min-content 1fr;
  
 

`
const TableBody = styled.div`
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
  overflow-y: scroll;
  overflow-x: hidden;
  width: 100%;
  color: var(--Gray10);
  font-size: 15px;
  

`
const TitleContainer = styled.div`
  display: grid;
  align-items: center;
  justify-content: center;
  background: #3f3f3f;
  height: 2em;
  h3{
    margin: 0;
    color: white;
    font-weight: 500;
  }
  text-align: center;
`
const Row = styled.div`
  display: grid;
  align-items: center;
  height: 3em;
  gap: 0.6em;
  grid-template-columns: 
  minmax(100px, 0.1fr) //ID
  minmax(120px, 0.6fr) //Nombre
  minmax(148px, 0.5fr) //Telefono
  minmax(120px, 1fr) //Direccion
  minmax(92px, 0.2fr); //acción
  @media (max-width: 800px){
    gap: 0;
  }
  ${(props) => {
    switch (props.container) {
      case 'first':
        return `
        @media (max-width: 800px){
        display: grid;
        grid-template-columns: min-content 1fr;
        span{
          display: block;
          transform: rotate(90deg);
          width: 
        }
      }
      
      `
      default:

    }
  }}
    ${(props) => {
    switch (props.border) {
      case 'border-bottom':
        return `
              border-bottom: 1px solid rgba(0, 0, 0, 0.200);
              &:last-child{
                border-bottom: none;
              }
              `
      default:
    }
  }}
  ${(props) => {
    switch (props.color) {
      case 'header':
        return `
        background-color: #9c0e0e;
        `
      case 'item':
        return `
        background-color: #ebebeb;
        `
      default:
    }
  }}
  ${(props) => {
    switch (props.fill) {
      case 'fill':
        return `
          padding-right: 16px;
          height: 2em;
          background-color: var(--White1);
        `

      default:
        break;
    }
  }}
`
const Col = styled.div`
  padding: 0 0.6em;
  ${props => {
    switch (props.position) {
      case 'right':
        return`
          text-align: right;
        `;
    
      default:
        break;
    }
  }}
  ${(props) => {
    switch (props.size) {
      case 'limit':
        return `
          width: 100%;
          
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;  
          //white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          `

      default:
        break;
    }
  }}
`