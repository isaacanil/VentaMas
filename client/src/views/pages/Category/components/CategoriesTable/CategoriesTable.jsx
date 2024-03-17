import React, { useState } from 'react'
import styled from 'styled-components'
import { OrderItem } from '../ListItem/OrderItem'
import { useFbGetCategories } from '../../../../../firebase/categories/useFbGetCategories'
import { filterData } from '../../../../../hooks/search/useSearch'

export const CategoriesTable = ({searchTerm}) => {

  const { categories } = useFbGetCategories();
  const filterCategories = filterData(categories, searchTerm);

  return (
    <Container>
      <Body>
        <TitleContainer>
          <span>Administrar Categoría</span>
        </TitleContainer>
        <Table>
          <TableBody>
            {
              filterCategories.length > 0 ? (
                filterCategories.map(({ category }, index) => (
                  <OrderItem
                    key={index}
                    Row={Row}
                    Col={Col}
                    cat={category}
                  />
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
    overflow: hidden;
     padding: 1em;
`
const Body = styled.header`
    justify-self: center;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 10px;
    position: relative;
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
  display: grid;
  grid-template-rows:  1fr; 
  
  `
const TableBody = styled.div`

  display: grid;
  align-content: start;
  grid-template-columns:  repeat(auto-fill, minmax(250px, 1fr));
  overflow-y: scroll;
  color: var(--Gray10);
  font-size: 15px;

`
const TitleContainer = styled.div`
  display: grid;
  align-items: center;
  justify-content: center;
  background: #3f3f3f;
  height: 2em;
 
    color: white;
   
  font-weight: 600;
  text-align: center;
`
const Row = styled.div`
  display: grid;
  align-items: center;
  height: 3em;
  gap: 0.6em;
  grid-template-columns: 
  minmax(100px, 1fr) //Nombre
  minmax(100px, min-content); // accion
  border-right: 1px solid rgba(16, 16, 16, 0.200);
  border-bottom: 1px solid rgba(16, 16, 16, 0.200);


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
        return `
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