import { Fragment } from "react"
import { AddClientModal } from "./AddClient/AddClientModal"

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
  SelectAddProductOutflowModal,

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
import { ProductOutflowModal } from "./ProductOutflowModal/ProductOutflowModal"
import { SelectProductOutflow } from "../../../features/productOutflow/productOutflow"
import { OPERATION_MODES } from "../../../constants/modes"
import { ConfirmationDialog } from "./UserNotification/components/ConfirmationDialog/ConfirmationDialog"
import { DeleteClientAlert } from "../../templates/system/Alerts/DeleteClientAlert"
export const ModalManager = () => {
  const update = OPERATION_MODES.UPDATE.id;

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
  const AddProductOutflowModalSelected = useSelector(SelectAddProductOutflowModal)
  const ProductOutflowSelected = useSelector(SelectProductOutflow)
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
      {/* <ProductModal
        btnSubmitName='Guardar'
        title='Agregar Producto'
        isOpen={AddProdModalSelected}
        closeModal={closeModalAddProducts}
      /> */}
      <UpdateProductModal
        isOpen={UpdateProdModalSelected}
      />
      <SetCustomProduct
        isOpen={SetCustomPizzaSelected}
        handleOpen={handleModalSetCustomPizza}
      />
      <MessageAlert
        isOpen={ViewOrdersNotesModalDataSelected.isOpen}
        data={ViewOrdersNotesModalDataSelected.data}
      />
      <CreateContact
        isOpen={ClientModalDataSelected.isOpen}
        mode={ClientModalDataSelected.mode}
        data={ClientModalDataSelected.mode === update ? ClientModalDataSelected.data : null}
      />
      <ProviderForm
        isOpen={ProviderModalDataSelected.isOpen}
        mode={ProviderModalDataSelected.mode}
        data={ProviderModalDataSelected.mode === update ? ProviderModalDataSelected.data : null}
      />
      <AddOrderModal isOpen={AddOrderModalSelected} />
      {/* <AddProvider /> */}
      <Notification />
      <AddCategoryModal
        isOpen={AddCategoryModalSelected.isOpen}
        categoryToUpdate={AddCategoryModalSelected.data}
      />
      <ProductOutflowModal
        isOpen={AddProductOutflowModalSelected.isOpen}
        mode={ProductOutflowSelected.mode}
      />
      <Loader />
      <ImageViewer />
      <SmallNotification />
      <ConfirmationDialog />
      <DeleteClientAlert/>
    </Fragment>
  )

}