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
import { toggleClientModal } from '../../../../features/modals/modalSlice.js'
import { OPERATION_MODES } from '../../../../constants/modes.js'
import * as antd from 'antd'
const { Select } = antd
import { fbGetTaxReceipt } from '../../../../firebase/taxReceipt/fbGetTaxReceipt.js'
import { selectNcfType, selectTaxReceiptType } from '../../../../features/taxReceipt/taxReceiptSlice.js'

export const ClientControl = () => {
  const dispatch = useDispatch()

  const { clients } = useFbGetClients()

  const client = useSelector(selectClient)
  const mode = useSelector(selectClientMode)

  const [searchTerm, setSearchTerm] = useState('')
  const filteredClients = filtrarDatos(clients, searchTerm)
  const clientLabel = useSelector(selectLabelClientMode)
  const [inputIcon, setInputIcon] = useState()
  const taxReceiptData = fbGetTaxReceipt()
  const isOpen = useSelector(selectIsOpen)
  const nfcType = useSelector(selectNcfType)
  const closeMenu = () => dispatch(setIsOpen(false))

  const createClientMode = () => dispatch(setClientMode(CLIENT_MODE_BAR.CREATE.id))
  const openAddClientModal = () => dispatch(toggleClientModal({ mode: OPERATION_MODES.CREATE.id, data: null, addClientToCart: true }))
  const openUpdateClientModal = () => dispatch(toggleClientModal({ mode: OPERATION_MODES.UPDATE.id, data: client, addClientToCart: true }))
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
        {
          mode === CLIENT_MODE_BAR.SEARCH.id && (
            <Button
              title={'Cliente'}
              startIcon={<MdPersonAdd />}
              borderRadius={'normal'}
              bgcolor={'warning'}
              onClick={openAddClientModal}
            />
          )
        }
        {
          mode === CLIENT_MODE_BAR.UPDATE.id && (
            <Button
              title={'Editar'}
              startIcon={CLIENT_MODE_BAR.UPDATE.icon}
              borderRadius={'normal'}
              bgcolor={'warning'}
              onClick={openUpdateClientModal}
            />
          )
        }
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
      <Select
        style={{ width: 200 }}
        value={nfcType}
        onChange={(e) => dispatch(selectTaxReceiptType(e))}
      >
        <Select.OptGroup label="Comprobantes Fiscal" >
          {taxReceiptData.taxReceipt
            .map(({ data }, index) => (
              <Select.Option value={data.name} key={index}>{data.name}</Select.Option>
            ))
          }
        </Select.OptGroup>
      </Select>
    </Container>
  )
}

const Container = styled.div`
    position: relative;
    display: grid;
    gap: 6px;
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
      z-index: 10;
      background-color: var(--Gray8);
      border-bottom-left-radius: var(--border-radius-light);
      padding: 0 0.3em;
      `