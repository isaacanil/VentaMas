import {  Fragment } from "react"
import { AddClientModal } from "./addClient/AddClientModal"
import { AddProductModal } from "./addProduct/AddProductModal"
import { BillingModal } from "../../component/modals/Billing/BillingModal"
import { UpdateProductModal } from "./UpdateProduct/UpdateProductModal"
import { useModal } from "../../../hooks/useModal"
export const ModalManager = () => {
  

  return(
    <Fragment>
      <AddClientModal /> 
      <AddProductModal />
      <BillingModal />
      <UpdateProductModal />
    </Fragment>
  )

}