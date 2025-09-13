import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faHome, 
  faCashRegister, 
  faShoppingCart, 
  faCube, 
  faFileText, 
  faCog,
  faBoxesStacked,
  faWarehouse
} from '@fortawesome/free-solid-svg-icons'
import { Line } from 'react-chartjs-2'

import styled from 'styled-components'
import { Sidebar } from './components/Menu/Nav'
import { HomeScreenContent } from './components/HomeScreenContent/HomeScreenContent'
export const HomeScreen = () => {  const items = [
    {
      icon: <FontAwesomeIcon icon={faHome}/>,
      label: 'Inicio',
    },
    {
      icon: <FontAwesomeIcon icon={faCashRegister} />,
      label: 'Ventas',
    },
    {
      icon: <FontAwesomeIcon icon={faShoppingCart} />,
      label: 'Compras',
    },
    {
      icon: <FontAwesomeIcon icon={faCube}/>,
      label: 'Inventario',
    },
    {
      icon: <FontAwesomeIcon icon={faBoxesStacked}/> ,
      label: 'Control de Inventario',
    },
    {
      icon: <FontAwesomeIcon icon={faWarehouse}/> ,
      label: 'Almacenes',
    },
    {
      icon: <FontAwesomeIcon icon={faFileText} />,
      label: 'Registro'
    },
    {
      icon: <FontAwesomeIcon icon={faCog} />,
      label: 'Configuración',
    },
  ]
  return (
    <Container>
      <Sidebar items={items}></Sidebar>
      <HomeScreenContent />
    </Container>
  )
}
const Container = styled.div`
display: flex;
`