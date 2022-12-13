import { Fragment } from "react"
import { AddClientModal } from "./AddClient/AddClientModal"
import { ProductModal } from "./Product/ProductModal"
import { BillingModal } from "../../component/modals/Billing/BillingModal"
import { UpdateProductModal } from "./UpdateProduct/UpdateProductModal"
import { useModal } from "../../../hooks/useModal"
import { AddOrderModal } from "./AddOrder/AddOrderModal"
import { SetCustomProduct } from "./CustomProduct/SetCustomProduct"
import { AddProvider } from "./AddProvider/AddProvider"
import { useSelector } from "react-redux"
import { useDispatch } from "react-redux"
import {
  SelectAddClientModal,
  SelectAddOrderModal,
  SelectAddProdModal,
  SelectBillingModal,
  SelectUpdateProdModal,
  SelectSetCustomPizzaModal,
  handleModalSetCustomPizza,
  closeModalAddProd,
  closeModalUpdateProd,

} from "../../../features/modals/modalSlice"
export const ModalManager = () => {
  const dispatch = useDispatch()
  const AddClientModalSelected = useSelector(SelectAddClientModal)
  const AddOrderModalSelected = useSelector(SelectAddOrderModal)
  const AddProdModalSelected = useSelector(SelectAddProdModal)
  const BillingModalSelected = useSelector(SelectBillingModal)
  const UpdateProdModalSelected = useSelector(SelectUpdateProdModal)
  const SetCustomPizzaSelected = useSelector(SelectSetCustomPizzaModal)
  //console.log(AddClientModalSelected)

  const handleSubmitAddProducts = async () => {
    /****************************************************************** */
    const extentionsFile = /.jpg|.jpeg|.png| .webp| .gif/i;
    if (!extentionsFile.exec(productImage.name)) {
      console.log(productImage.name)
      setErrorMassage(<ErrorMessage text='Error de archivo (no es una imagen valida)'></ErrorMessage>)
    } else {
      setErrorMassage('')
      //referencia
      UploadProdImg(productImage).then((url) => UploadProdData(
        url,
        productName,
        cost,
        taxRef,
        stock,
        category,
        netContent,
      ))

      try {

        return <Navigate to={'/app/'}></Navigate>
      }
      catch (e) {
        console.error("Error adding document: ", e)
      }
    }
    /******************************************************************************** */


  }
  const closeModalAddProducts = () => {
    dispatch(
      closeModalAddProd()
    )
  }
  const handleSubmitUpdateProducts = async () => {
    /****************************************************************** */
    const extentionsFile = /.jpg|.jpeg|.png| .webp| .gif/i;
    if (!extentionsFile.exec(productImage.name)) {
      console.log(productImage.name)
      setErrorMassage(<ErrorMessage text='Error de archivo (no es una imagen valida)'></ErrorMessage>)
    } else {
      setErrorMassage('')
      //referencia
      UploadProdImg(productImage).then((url) => UploadProdData(
        url,
        productName,
        cost,
        taxRef,
        stock,
        category,
        netContent,
      ))

      try {
        return <Navigate to={'/app/'}></Navigate>
      }
      catch (e) {
        console.error("Error adding document: ", e)
      }
    }
    /******************************************************************************** */


  }
  const closeModalUpdateProducts = () => {
    dispatch(
      closeModalUpdateProd()
    )
  }
  return (
    <Fragment>
      <AddClientModal
        isOpen={AddClientModalSelected}
      />
      <ProductModal
        btnSubmitName='Guardar'
        title='Agregar Producto'
        isOpen={AddProdModalSelected}
        closeModal={closeModalAddProducts}
      />
      {/* <ProductModal
        btnSubmitName='Actualizar'
        title='Actualizar Producto'
        isOpen={UpdateProdModalSelected}
        closeModal={closeModalUpdateProducts}
        handleSubmit={handleSubmitUpdateProducts}
      /> */}
      <UpdateProductModal
        isOpen={UpdateProdModalSelected}
      />
      <BillingModal isOpen={BillingModalSelected} />
      <SetCustomProduct
        isOpen={SetCustomPizzaSelected}
        handleOpen={handleModalSetCustomPizza}
      />
      <AddOrderModal isOpen={AddOrderModalSelected} />
      <AddProvider />
    </Fragment>
  )

}