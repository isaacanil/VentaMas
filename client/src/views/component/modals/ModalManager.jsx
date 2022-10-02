import { Fragment } from "react"
import { AddClientModal } from "./AddClient/AddClientModal"
import { AddProductModal } from "./AddProduct/AddProductModal"
import { BillingModal } from "../../component/modals/Billing/BillingModal"
import { UpdateProductModal } from "./UpdateProduct/UpdateProductModal"
import { useModal } from "../../../hooks/useModal"
import { AddOrderModal } from "./AddOrder/AddOrderModal"
export const ModalManager = () => {
  return(
    <Fragment>
      <AddClientModal /> 
      <AddProductModal />
      <BillingModal />
      <UpdateProductModal />
      <AddOrderModal></AddOrderModal>
    </Fragment>
  )

}