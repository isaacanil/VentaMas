import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { closeModalUpdateProd } from '../../../../features/modals/modalSlice'
import { ChangeProductData, ChangeProductImage, clearUpdateProductData, selectUpdateProductData, setProduct } from '../../../../features/updateProduct/updateProductSlice'
import { getCat, getTaxes } from '../../../../firebase/firebaseconfig'
import { Button } from '../../../templates/system/Button/Button'
import { Input } from '../../../templates/system/Inputs/InputV2'
import { UploadImg } from '../../UploadImg/UploadImg'
import { Modal } from '../Modal'
import { quitarCeros } from '../../../../hooks/quitarCeros'
import { fbUpdateProduct } from '../../../../firebase/products/fbUpdateProduct'
import { InventariableButton } from './InventariableButton'
import { productDataTypeCorrection } from '../../../../features/updateProduct/validateProductDataType'
import { addNotification } from '../../../../features/notification/NotificationSlice'
import { productSchema } from '../../../../features/updateProduct/productSchema'
import { toggleLoader } from '../../../../features/loader/loaderSlice'
import { InputV4 } from '../../../templates/system/Inputs/InputV4'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { useFormatNumber } from '../../../../hooks/useFormatNumber'
import noImage from '../../../../assets/producto/noImg.png'
import { modes } from '../../../../constants/modes'
import { fbAddProduct } from '../../../../firebase/products/fbAddProduct'
import { initTaxes } from './InitializeData'
import { selectUser } from '../../../../features/auth/userSlice'
export const UpdateProductModal = ({ isOpen }) => {
    const { status, product } = useSelector(selectUpdateProductData)
    const [taxesList, setTaxesList] = useState(initTaxes)
    const [catList, setCatList] = useState([])
    const [imgController, setImgController] = useState(false)
    const user = useSelector(selectUser);
    const dispatch = useDispatch()
    const updateMode = modes.operationModes.updateMode
    const handleImgController = (e) => {
        e.preventDefault()
        setImgController(!imgController)
    }

    useEffect(() => {
        
        getTaxes(setTaxesList)
        getCat(setCatList)
    }, [])

    const calculatePrice = () => {
        const { cost, tax } = product;
        let result = (Number(cost.unit) * Number(tax.value) + Number(cost.unit))
        const price = {
            unit: useFormatNumber(result, 'number', true),
            total: useFormatNumber(result, 'number', true),
        }
        dispatch(setProduct({ ...product, price }))
    }

    useEffect(calculatePrice, [product.cost, product.tax])

    const productDataTypeCorrected = new productDataTypeCorrection(product);

    const handleUpdateProduct = () => {
        dispatch(addNotification({ title: 'Producto Actualizado', message: 'Espere un momento', type: 'success' }))
        fbUpdateProduct(productDataTypeCorrected, dispatch, user)
    }

    const handleAddProduct = () => {
        dispatch(addNotification({ title: 'Producto Creado', message: 'Espere un momento', type: 'success' }))
        fbAddProduct(productDataTypeCorrected, dispatch, user)
    }

    const handleSubmit = async () => {
        try {
            await productSchema.validate(productDataTypeCorrected);
            if (status === 'update') {
                handleUpdateProduct()
            }
            if (status === 'create') {
                handleAddProduct()
            }
        } catch (error) {
            console.error(error)
            dispatch(addNotification({ title: 'error', message: 'Favor Informar a Soporte Técnico', type: 'error' }))
        }
    }

    const closeModal = () => {
        dispatch(closeModalUpdateProd())
        dispatch(clearUpdateProductData())
    }

    const localUpdateImage = (url) => dispatch(ChangeProductImage(url));

    return (
        <Modal
            nameRef={updateMode === status ? `Actualizar ${product.id} ` : 'Agregar Producto'}
            isOpen={isOpen}
            close={closeModal}
            btnSubmitName='Guardar'
            handleSubmit={handleSubmit}
            subModal={
                <UploadImg
                    fnAddImg={localUpdateImage}
                    isOpen={imgController}
                    setIsOpen={setImgController}
                />
            }
        >
            <Container>
                <FormGroup column='2'>
                    <InputV4
                        name='productName'
                        label={'Nombre del producto:'}
                        required
                        type="text"
                        onClear={() => dispatch(setProduct({ ...product, productName: '' }))}
                        errorMessage={'El nombre del producto es requerido'}
                        validate={product?.productName === ''}
                        value={product?.productName || ''}
                        onChange={(e) => dispatch(setProduct({ ...product, productName: e.target.value }))}
                    />
                </FormGroup>
                <FormGroup orientation='vertical'>
                    <InputV4
                        label={'Tipo de Producto:'}
                        type="text"
                        name='type'
                        required
                        value={product?.type || ''}
                        onChange={(e) => dispatch(setProduct({ ...product, type: e.target.value }))}
                    />
                    <InputV4
                        size='small'
                        type="text"
                        label={'Ordenar por'}
                        name='order'
                        required
                        value={product?.order}
                        onChange={(e) => dispatch(setProduct({ ...product, order: e.target.value }))}
                    />

                </FormGroup>
                <FormGroup orientation='vertical'>
                    <InputV4
                        label={'Tamaño'}
                        type="text"
                        name="size"
                        placeholder='Contenido Neto:'
                        value={product?.size}
                        onChange={(e) => dispatch(setProduct({ ...product, size: e.target.value }))}
                    />
                    <select
                        name="category"
                        id=""
                        onChange={(e) => dispatch(setProduct({ ...product, category: e.target.value }))}>                        <option value="">Categoría</option>
                        {
                            catList.length > 0 ? (
                                catList.map((item, index) => (
                                    <option
                                        key={index}
                                        value={item.category.name}
                                        selected={item.category.name === product.category}
                                    >
                                        {item.category.name}
                                    </option>
                                ))
                            ) : null
                        }
                    </select>
                    <InputV4
                        label={'Contenido neto'}
                        type="text"
                        placeholder='Contenido Neto:'
                        name='netContent'
                        value={product?.netContent || undefined}
                        onChange={(e) => dispatch(setProduct({ ...product, netContent: e.target.value }))}
                    />
                </FormGroup>
                <FormGroup>
                    <ImgContainer>
                        <Img>
                            <img
                                src={product?.productImageURL || noImage}
                                style={product?.productImageURL ? null : { objectFit: "contain" }} alt="" />
                        </Img>
                        <Align position='center'>
                            <Button
                                borderRadius='normal'
                                title={status === "update" ? 'Actualizar' : 'Agregar Imagen'}
                                bgcolor='primary'
                                titlePosition='center'
                                onClick={handleImgController}
                            />
                        </Align>
                    </ImgContainer>
                </FormGroup>
                <FormGroup orientation='vertical' >
                    <InventariableButton
                        setProduct={setProduct}
                        product={product}
                    />
                    <InputV4
                        label={'Stock:'}
                        type="number"
                        placeholder='stock'
                        name='stock'
                        value={product?.stock}
                        onChange={(e) => dispatch(setProduct({ ...product, stock: e.target.value }))}
                    />

                </FormGroup>
                <FormGroup orientation='vertical'>
                    <InputV4
                        label={'Costo'}
                        type="number"
                        value={product?.cost?.unit}
                        onChange={(e) => dispatch(setProduct({ ...product, cost: { ...product.cost, unit: e.target.value, total: e.target.value } }))}
                    />
                    <select id=""
                        onChange={(e) => dispatch(setProduct({
                            ...product,
                            tax: JSON.parse(e.target.value)
                        }))}>
                        <option value="">Impuesto</option>
                        {
                            taxesList.length > 0 ? (
                                taxesList.map(({ tax }, index) => (
                                    <option
                                        selected={tax.value === product.tax.value}
                                        value={JSON.stringify(tax)}
                                        key={index}
                                    >ITBIS {tax.ref}</option>
                                ))
                            ) : null
                        }
                    </select>
                    <InputV4
                        type="number"
                        label={'Precio + ITBIS'}
                        value={status ? product.price.unit : undefined}
                        readOnly
                        placeholder='Precio de Venta' />
                </FormGroup>
            </Container>
        </Modal>
    )
}

const Container = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 1em 1em 1em;
    background-color: var(--White2);
    height: 100%;
    width: 100%;
    gap: 0.6em;
    align-content: flex-start;
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }    
`
const FormGroup = styled.div`
    align-items: end;
    background-color: var(--White);
    border-radius: var(--border-radius-light);
    padding: 0.4em;
 
    select{
         padding: 0 0.4em;
         border-radius: var(--border-radius-light);
         border: var(--border-primary);
         height: 2em;       
         
      }
    &:nth-child(1){
        grid-column: 2 span;
      
    }
    &:nth-child(2){
        grid-column: 1 / 3;
        display: grid;
         grid-template-columns: repeat(2, 1fr);
    }
    &:nth-child(3){ 
        grid-column: 1 / 4;
        display: grid;
         grid-template-columns: repeat(3, 1fr);
    }
    &:nth-child(4){
      
        display: grid;

        grid-column: 3 / 4;
        grid-row: 1 / 3;
       
    }
    &:nth-child(5){
        grid-column: 1 / 4;
        display: grid;
         grid-template-columns: repeat(3, 1fr);
    }
    &:nth-child(6){
       grid-column: 1 / 4;
       display: grid;
         grid-template-columns: repeat(3, 1fr);
     
   }
   
    ${(props) => {
        switch (props.orientation) {
            case 'vertical':
                return `
                    display: flex;
                    gap: 1em;
                `

            case 'horizontal':
                return `
                    display: grid
                `
            default:
                break;
        }
    }}
  
`
const ImgContainer = styled.div`
    display: grid;
    width: 100%;
    gap: 0.4em;
`
const Img = styled.div`
background-color: white;
border-radius: 8px;
overflow: hidden;
display: block;
width: 100%;
height: 100px;
img{
    width: 100%;
    height: 100px;
    object-fit: cover;
    box-shadow: 0 0 10px 0 rgba(0,0,0,0.5);
}
`
const InvetoryCheckContainer = styled.div`
    position: relative;
    height: 2em;
    width: 8em;
    display: flex;
    align-items: center;
    label{
        padding: 0 1em;
        border-radius: var(--border-radius-light);
        background-color: #0084ff;
        height: 100%;
        display: flex;
        align-items: center;
        /* position: absolute;
        top: -16px;
        font-size: 12px;
        line-height: 12px; */
    }
    input[type="checkbox"]:checked + label{
        background-color: green;
    }
    input[type="checkbox"]{
        margin: 0;
        
        
    }
`
const Align = styled.div`
width: 100%;
    ${props => {
        switch (props.position) {
            case 'left':
                return `
                    display: flex;
                    justify-content: flex-start;
                `
            case 'right':
                return `
                    display: flex;
                    justify-content: flex-end;
                `
            case 'center':
                return `
                    display: flex;
                    justify-content: center;
                `
            default:
                break;
        }



    }}
    `