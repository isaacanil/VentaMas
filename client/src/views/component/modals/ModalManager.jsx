import { Fragment } from "react"
import { AddClientModal } from "./AddClient/AddClientModal"
import { ProductModal } from "./Product/ProductModal"
import { UpdateProductModal } from "./UpdateProduct/UpdateProductModal"
import { AddOrderModal } from "./AddOrder/AddOrderModal"
import { SetCustomProduct } from "./CustomProduct/SetCustomProduct"
import { AddProvider } from "./AddProvider/AddProvider"
import { useSelector } from "react-redux"
import { useDispatch } from "react-redux"
import {
  SelectAddClientModal,
  SelectAddOrderModal,
  SelectAddProdModal,
  SelectUpdateProdModal,
  SelectSetCustomPizzaModal,
  handleModalSetCustomPizza,
  closeModalAddProd,
  SelectProviderModalData,
  SelectClientModalData,
  SelectViewOrdersNotesModalData,
  SelectAddPurchaseModal,

} from "../../../features/modals/modalSlice"
import { CreateContact } from "../../pages/Contact/Client/components/ClientForm/ClientForm"
import { ProviderForm } from "../../pages/Contact/Provider/components/CreateContact/ProviderForm"
import { MessageAlert } from "../../templates/system/Alerts/MessageAlert"
import { AddPurchaseModal } from "./AddPurchase/AddPurchaseModal"
export const ModalManager = () => {
  const dispatch = useDispatch()
  const AddPurchaseModalSelected = useSelector(SelectAddPurchaseModal)
  const AddClientModalSelected = useSelector(SelectAddClientModal)
  const AddOrderModalSelected = useSelector(SelectAddOrderModal)
  const AddProdModalSelected = useSelector(SelectAddProdModal)
  const UpdateProdModalSelected = useSelector(SelectUpdateProdModal)
  const SetCustomPizzaSelected = useSelector(SelectSetCustomPizzaModal)
  const ClientModalDataSelected = useSelector(SelectClientModalData)
  const ProviderModalDataSelected = useSelector(SelectProviderModalData)
  const ViewOrdersNotesModalDataSelected = useSelector(SelectViewOrdersNotesModalData)
  //console.log(AddClientModalSelected)

  const closeModalAddProducts = () => {dispatch(closeModalAddProd())}
  return (
    <Fragment>
      <AddClientModal
        isOpen={AddClientModalSelected}
      />
      <AddPurchaseModal
        isOpen={AddPurchaseModalSelected}
      />
      <ProductModal
        btnSubmitName='Guardar'
        title='Agregar Producto'
        isOpen={AddProdModalSelected}
        closeModal={closeModalAddProducts}
      />
      <UpdateProductModal
        isOpen={UpdateProdModalSelected}
      />
      <SetCustomProduct
        isOpen={SetCustomPizzaSelected}
        handleOpen={handleModalSetCustomPizza}
      />
      <MessageAlert isOpen={ViewOrdersNotesModalDataSelected.isOpen} data={ViewOrdersNotesModalDataSelected.data}></MessageAlert>
      <CreateContact isOpen={ClientModalDataSelected.isOpen} mode={ClientModalDataSelected.mode} data={ClientModalDataSelected.mode === 'update' ? ClientModalDataSelected.data : null}></CreateContact>
      <ProviderForm isOpen={ProviderModalDataSelected.isOpen} mode={ProviderModalDataSelected.mode} data={ProviderModalDataSelected.mode === 'update' ? ProviderModalDataSelected.data : null}></ProviderForm>
      <AddOrderModal isOpen={AddOrderModalSelected} />
      {/* <AddProvider /> */}
    </Fragment>
  )

}