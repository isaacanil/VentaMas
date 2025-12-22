import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../features/auth/userSlice';
import { useFbGetProviders } from '../../../../../../firebase/provider/useFbGetProvider';
import { ProviderCard } from '../../ListItem/ProviderCard';

export const ProviderTable = () => {
  const user = useSelector(selectUser);
  const { providers } = useFbGetProviders(user);

  return (
    <Container>
      <Body>
        <TitleContainer>
          <h3>Administrar Proveedores</h3>
        </TitleContainer>
        <Table>
          <Row fill="fill">
            <Col>#</Col>
            <Col>Nombre</Col>
            <Col>Teléfono</Col>
            <Col>Dirección</Col>
            <Col>Acción</Col>
          </Row>

          <TableBody>
            {Array(providers).length > 0
              ? providers.map(({ provider }, index) => (
                  <ProviderCard
                    Row={Row}
                    Col={Col}
                    key={index}
                    e={provider}
                    index={index}
                  />
                ))
              : null}
          </TableBody>
        </Table>
      </Body>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 1em;
  width: 100%;
`;
const Body = styled.header`
  /* max-height: 400px; */
  background-color: #fff;
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: 10px;
  display: grid;
  grid-template-rows: min-content 1fr;
  height: calc(100vh - 2.75em - 2.5em - 1.5em);
  justify-self: center;
  max-width: 1000px;
  overflow: hidden;
  position: relative;
  width: 100%;

  @media (width <= 800px) {
    max-height: 100%;
  }
`;
const Table = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  overflow: hidden;
  overflow-x: auto;
  position: relative;
  width: 100%;
`;
const TableBody = styled.div`
  align-content: flex-start;
  align-items: flex-start;
  color: var(--gray-10);
  display: grid;
  font-size: 15px;
  overflow: hidden scroll;
  width: 100%;
`;
const TitleContainer = styled.div`
  align-items: center;
  background: #3f3f3f;
  display: grid;
  height: 2em;
  justify-content: center;
  text-align: center;

  h3 {
    color: white;
    font-weight: 500;
    margin: 0;
  }
`;
const Row = styled.div`
  display: grid;
  align-items: center;
  height: 3em;
  gap: 0.6em;

  /* id, nombre, telefono, direccion, accion */
  grid-template-columns: minmax(100px, 0.1fr)
    minmax(120px, 0.6fr)
    minmax(148px, 0.5fr)
    minmax(120px, 1fr)
    minmax(92px, 0.2fr);

  @media (width <= 800px) {
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
      
      `;
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
              `;
      default:
    }
  }}
  ${(props) => {
    switch (props.color) {
      case 'header':
        return `
        background-color: #9c0e0e;
        `;
      case 'item':
        return `
        background-color: #ebebeb;
        `;
      default:
    }
  }}
  ${(props) => {
    switch (props.fill) {
      case 'fill':
        return `
          padding-right: 16px;
          height: 2em;
          background-color: var(--white-1);
        `;

      default:
        break;
    }
  }}
`;
const Col = styled.div`
  padding: 0 0.6em;
  ${(props) => {
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
          `;

      default:
        break;
    }
  }}
`;
