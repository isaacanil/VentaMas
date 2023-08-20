import { Fragment } from "react"
import { AddClientModal } from "./AddClient/AddClientModal"

import { UpdateProductModal } from "./UpdateProduct/UpdateProductModal"
import { AddOrderModal } from "./AddOrder/AddOrderModal"
import { SetCustomProduct } from "./CustomProduct/SetCustomProduct/SetCustomProduct"

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
import { ClientForm } from "../../pages/Contact/Client/components/ClientForm/ClientForm"
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
import { AnimatePresence } from "framer-motion"
import { selectCurrentNotification } from "../../../features/notification/NotificationSlice"
export const ModalManager = () => {
  const update = OPERATION_MODES.UPDATE.id;
  const AddPurchaseModalSelected = useSelector(SelectAddPurchaseModal)
  const AddClientModalSelected = useSelector(SelectAddClientModal)
  const AddOrderModalSelected = useSelector(SelectAddOrderModal)
  const UpdateProdModalSelected = useSelector(SelectUpdateProdModal)
  const SetCustomPizzaSelected = useSelector(SelectSetCustomPizzaModal)
  const ClientModalDataSelected = useSelector(SelectClientModalData)
  const ProviderModalDataSelected = useSelector(SelectProviderModalData)
  const AddCategoryModalSelected = useSelector(SelectAddCategoryModal)
  const ViewOrdersNotesModalDataSelected = useSelector(SelectViewOrdersNotesModalData)
  const AddProductOutflowModalSelected = useSelector(SelectAddProductOutflowModal)
  const ProductOutflowSelected = useSelector(SelectProductOutflow)
  const currentNotification = useSelector(selectCurrentNotification)

  return (
    <Fragment>
      <AnimatePresence>
        {AddClientModalSelected && (
          <AddClientModal
            key={'modal-add-client'}
            isOpen={AddClientModalSelected}
          />
        )}
        {AddPurchaseModalSelected && (
          <AddPurchaseModal
            key={'modal-add-purchase'}
            isOpen={AddPurchaseModalSelected}
          />
        )}
        {UpdateProdModalSelected && (
          <UpdateProductModal
            key='modal-update-product'
            isOpen={UpdateProdModalSelected}
          />
        )}
        {SetCustomPizzaSelected && (
          <SetCustomProduct
            key={'modal-set-custom-pizza'}
            isOpen={SetCustomPizzaSelected}
            handleOpen={handleModalSetCustomPizza}
          />
        )}


        {ClientModalDataSelected.isOpen && (
          <ClientForm
            key={'modal-client'}
            isOpen={ClientModalDataSelected.isOpen}
            mode={ClientModalDataSelected.mode}
            data={ClientModalDataSelected.mode === update ? ClientModalDataSelected.data : null}
          />
        )}
        {ProviderModalDataSelected.isOpen && (
          <ProviderForm
            key={'modal-provider'}
            isOpen={ProviderModalDataSelected.isOpen}
            mode={ProviderModalDataSelected.mode}
            data={ProviderModalDataSelected.mode === update ? ProviderModalDataSelected.data : null}
          />
        )}
        {AddOrderModalSelected && (
          <AddOrderModal
            key={'modal-add-order'}
            isOpen={AddOrderModalSelected}
          />
        )}
        {/* <AddProvider /> */}
        {currentNotification.visible && (
          <Notification
            key={'notification'}
          />
        )}
        {AddCategoryModalSelected.isOpen && (
          <AddCategoryModal
            key={'modal-add-category'}
            isOpen={AddCategoryModalSelected.isOpen}
            categoryToUpdate={AddCategoryModalSelected.data}
          />
        )}
        {AddProductOutflowModalSelected.isOpen && (
          <ProductOutflowModal
            key={'modal-product-outflow'}
            isOpen={AddProductOutflowModalSelected.isOpen}
            mode={ProductOutflowSelected.mode}
          />
        )}
        {ViewOrdersNotesModalDataSelected.isOpen && (
          <MessageAlert
            key={'modal-view-orders-notes'}
            isOpen={ViewOrdersNotesModalDataSelected.isOpen}
            data={ViewOrdersNotesModalDataSelected.data}
          />
        )}
      </AnimatePresence>
      <Loader />
      <ImageViewer />
      <SmallNotification />
      <ConfirmationDialog />
      <DeleteClientAlert />
    </Fragment>
  )

}