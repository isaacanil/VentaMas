import React, { useState, useEffect, useMemo } from 'react'
import { useFbGetClients } from '../../../../firebase/client/useFbGetClients'
import { getClient, setChange, toggleCart, totalPurchase } from '../../../../features/cart/cartSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useClickOutSide } from '../../../../hooks/useClickOutSide.jsx'
import { useRef } from 'react'
import { ClientDetails } from './ClientDetails/ClientDetails.jsx'
import { SearchClient } from '../../../templates/system/Inputs/SearchClient.jsx'
import { ClientSelector } from './ClientSelector.jsx'
import { filtrarDatos, useSearchFilter } from '../../../../hooks/useSearchFilter.js'
import { updateObject } from '../../../../utils/object/updateObject'
import { deleteClient, selectClient, selectClientMode, selectIsOpen, selectLabelClientMode, setClient, setClientMode, setIsOpen } from '../../../../features/clientCart/clientCartSlice'
import { CLIENT_MODE_BAR } from '../../../../features/clientCart/clientMode'
import { Button } from '../../../templates/system/Button/Button'
import { MdPersonAdd } from 'react-icons/md'
import styled from 'styled-components'
import { useWindowWidth } from '../../../../hooks/useWindowWidth'

export const ClientControl = () => {

  const dispatch = useDispatch()

  const { clients } = useFbGetClients()

  const client = useSelector(selectClient)
  const mode = useSelector(selectClientMode)

  const [searchTerm, setSearchTerm] = useState('')
  const filteredClients = filtrarDatos(clients, searchTerm)
  const clientLabel = useSelector(selectLabelClientMode)
  const [inputIcon, setInputIcon] = useState()

  const isOpen = useSelector(selectIsOpen)

  const closeMenu = () => dispatch(setIsOpen(false))

  const createClientMode = () => dispatch(setClientMode(CLIENT_MODE_BAR.CREATE.id))

  const updateClientMode = () => dispatch(setClientMode(CLIENT_MODE_BAR.UPDATE.id))

  const searchClientMode = () => dispatch(setClientMode(CLIENT_MODE_BAR.SEARCH.id));

  const handleDeleteData = () => {
    dispatch(deleteClient())
  }
  const handleChangeClient = (e) => {
    if (mode === CLIENT_MODE_BAR.SEARCH.id) {
      setSearchTerm(e.target.value)
    }
    if (mode === CLIENT_MODE_BAR.UPDATE.id || mode === CLIENT_MODE_BAR.CREATE.id) {
      dispatch(setClient(updateObject(client, e)))
    }
  }

  useEffect(() => {
    switch (mode) {
      case CLIENT_MODE_BAR.SEARCH.id:
        setInputIcon(CLIENT_MODE_BAR.SEARCH.icon)
        setSearchTerm('')
        break;

      case CLIENT_MODE_BAR.UPDATE.id:
        setInputIcon(CLIENT_MODE_BAR.UPDATE.icon)
        dispatch(totalPurchase())
        dispatch(setChange())
        closeMenu()
        break;

      case CLIENT_MODE_BAR.CREATE.id:
        setInputIcon(CLIENT_MODE_BAR.CREATE.icon)
        closeMenu()
        break;

      default:
        break;
    }
  }, [mode])

  useEffect(() => { dispatch(getClient(client)) }, [client])

  const searchClientRef = useRef(null)
  useClickOutSide(searchClientRef, isOpen === true, closeMenu)

  const OpenClientList = () => {
    switch (mode) {
      case CLIENT_MODE_BAR.CREATE.id:
        closeMenu()
        break;
      case CLIENT_MODE_BAR.SEARCH.id:
        dispatch(setIsOpen(true))
        break;
      case CLIENT_MODE_BAR.UPDATE.id:
        closeMenu()
        break;

      default:
        break;
    }
  }
  const handleCloseCart = () => {
    dispatch(toggleCart())
  }
  const limitByWindowWidth = useWindowWidth()
  return (
    <Container ref={searchClientRef}>

      <Header>
        <SearchClient
          icon={inputIcon}
          name='name'
          title={mode === CLIENT_MODE_BAR.SEARCH.id ? searchTerm : client.name}
          onFocus={OpenClientList}
          label={clientLabel}
          fn={handleDeleteData}
          onChange={(e) => handleChangeClient(e)}
        />
        <Button
          title={<MdPersonAdd />}
          width={'icon32'}
          borderRadius={'normal'}
          bgcolor={'warning'}
          onClick={createClientMode}
          
        />
        {!limitByWindowWidth && (
           <Button
           title={'volver'}
           onClick={handleCloseCart}
           borderRadius={'normal'}
           bgcolor={'gray'}
           
         />
        )}
       
      </Header>

      <ClientDetails
        mode={mode === CLIENT_MODE_BAR.CREATE.id}
      />
      {
        <ClientSelector
          updateClientMode={updateClientMode}
          createClientMode={createClientMode}
          mode={mode.mode}
          searchTerm={searchTerm}
          filteredClients={filteredClients}
        />
      }
    </Container>
  )
}

const Container = styled.div`
    position: relative;
    margin: 0;
    border: 0;
    width: 100%;
`
const Header = styled.div`
   width: 100%;
       gap: 10px;
      display: flex;
      align-items: center; 
      justify-content: space-between;
      height: 2.75em;
      position: relative;
      z-index: 20;
      background-color: var(--Gray8);
      border-bottom-left-radius: var(--border-radius-light);
      padding: 0 0.3em;
      `