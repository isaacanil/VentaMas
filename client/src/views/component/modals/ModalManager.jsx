import { Fragment } from "react"
import { AddClientModal } from "./AddClient/AddClientModal"
import { ProductModal } from "./Product/ProductModal"
import { UpdateProductModal } from "./UpdateProduct/UpdateProductModal"
import { AddOrderModal } from "./AddOrder/AddOrderModal"
import { SetCustomProduct } from "./CustomProduct/SetCustomProduct/SetCustomProduct"
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
  SelectAddCategoryModal,

} from "../../../features/modals/modalSlice"
import { CreateContact } from "../../pages/Contact/Client/components/ClientForm/ClientForm"
import { ProviderForm } from "../../pages/Contact/Provider/components/CreateContact/ProviderForm"
import { MessageAlert } from "../../templates/system/Alerts/MessageAlert"
import { AddPurchaseModal } from "./AddPurchase/AddPurchaseModal"
import { Notification } from "../../templates/system/Notification/Notification"
import { SmallNotification } from "../../templates/system/Notification/SmallNotification"
import Loader from "../../templates/system/loader/Loader"
import ImageViewer from "../../templates/system/ImageViewer/ImageViewer"
import AddCategoryModal from "./AddCategoryMode/AddCategoryMode"
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
  const AddCategoryModalSelected = useSelector(SelectAddCategoryModal)
  const ViewOrdersNotesModalDataSelected = useSelector(SelectViewOrdersNotesModalData)
  //console.log(AddClientModalSelected)

  const closeModalAddProducts = () => { dispatch(closeModalAddProd()) }
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
      <CreateContact 
      isOpen={ClientModalDataSelected.isOpen} 
      mode={ClientModalDataSelected.mode} 
      data={ClientModalDataSelected.mode === 'update' ? ClientModalDataSelected.data : null}/>
      <ProviderForm
        isOpen={ProviderModalDataSelected.isOpen}
        mode={ProviderModalDataSelected.mode}
        data={ProviderModalDataSelected.mode === 'update' ? ProviderModalDataSelected.data : null} />
      <AddOrderModal isOpen={AddOrderModalSelected} />
      {/* <AddProvider /> */}
      <Notification/>
      <AddCategoryModal 
        isOpen={AddCategoryModalSelected.isOpen}
        categoryToUpdate={AddCategoryModalSelected.data}
      />
      <Loader/>
      <ImageViewer/> 
      <SmallNotification/>
    </Fragment>
  )

}