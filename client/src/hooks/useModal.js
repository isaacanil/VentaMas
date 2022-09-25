import { useState } from 'react'

export const useModal = () =>{
    const [modalBilling, setModalBilling] = useState(false)
    const handleModalBilling = () => setModalBilling(!modalBilling)

    const [modalAddProd, setModalAddProd] = useState(false)
    const handleModalAddProd = () => setModalAddProd(!modalAddProd)

    const [modalAddClient, setModalAddClient] = useState(false)
    const handleModalAddClient = () => setModalAddClient(!modalAddClient)

  return {
    modalBilling,
    handleModalBilling,
    modalAddProd,
    handleModalAddProd,
    modalAddClient,
    handleModalAddClient
  }
}

