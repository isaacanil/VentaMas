import React from 'react'
import { AiFillHome } from 'react-icons/ai'
import { BiCog, BiMoney } from 'react-icons/bi'
import { FaCashRegister, FaShoppingCart } from 'react-icons/fa'
import { FiChevronRight, FiHome, FiSettings } from 'react-icons/fi'
import { IoCart, IoCash, IoCube, IoDocumentText, IoHome, IoSettings } from 'react-icons/io5'
import { MdArchive, MdAttachMoney, MdHome, MdInsertChart, MdLocalGroceryStore, MdPlaylistAdd, MdSettings, MdShoppingCart, MdStorage } from 'react-icons/md'
import { RiArchiveDrawerFill } from 'react-icons/ri'
import { Line } from 'react-chartjs-2';

import styled from 'styled-components'
import { Sidebar } from './components/Menu/Nav'
import { HomeScreenContent } from './components/HomeScreenContent/HomeScreenContent'
export const HomeScreen = () => {
  const items = [
    {
      icon: <IoHome/>,
      label: 'Inicio',
    },
    {
      icon: <IoCash />,
      label: 'Ventas',
    },
    {
      icon: <IoCart />,
      label: 'Compras',
    },
    {
      icon: <IoCube/>,
      label: 'Inventario',
    },
    {
      icon: <IoDocumentText />,
      label: 'Registro'
    },
    {
      icon: <IoSettings />,
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