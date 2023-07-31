import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { closeModalUpdateProd } from '../../../../features/modals/modalSlice'
import { ChangeProductData, ChangeProductImage, clearUpdateProductData, selectUpdateProductData, setProduct } from '../../../../features/updateProduct/updateProductSlice'
import { getTaxes } from '../../../../firebase/firebaseconfig'
import { Button } from '../../../templates/system/Button/Button'
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
import { OPERATION_MODES } from '../../../../constants/modes'
import { fbAddProduct } from '../../../../firebase/products/fbAddProduct'
import { initTaxes } from './InitializeData'
import { selectUser } from '../../../../features/auth/userSlice'
import { BarCodeControl } from './components/BarCodeControl'
import { QRCodeControl } from './components/QRCodeControl'
import { useFbGetCategories } from '../../../../firebase/categories/useFbGetCategories'
import useImageFallback from '../../../../hooks/image/useImageFallback'

const validateProduct = (product) => {
    let errors = {};
    if (!product.productName) {
        console.log("***************** entrando " )
        errors.productName = 'Nombre del producto es requerido';
        console.log(errors, "***************** error productname")
    }
    if (!product.type) {
        errors.type = 'Tipo de producto es requerido';
    }
    if (!product.tax) {
        errors.tax = 'Impuesto es requerido';
    }
    if (!product.cost.unit) {
        errors.cost = 'Costo es requerido';
    }
    return errors;
}

export const UpdateProductModal = ({ isOpen }) => {
    const { status, product } = useSelector(selectUpdateProductData)
    const [taxesList, setTaxesList] = useState(initTaxes)

    const [imgController, setImgController] = useState(false)
    const user = useSelector(selectUser);
    const dispatch = useDispatch()
    const updateMode = OPERATION_MODES.UPDATE.label
    const handleImgController = () => {
      
        setImgController(!imgController)
    }
    const [errors, setErrors] = useState({
    })

    useEffect(() => {
        getTaxes(setTaxesList)
    }, [])

    const { categories } = useFbGetCategories()

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
        const errors = validateProduct(product);
        try {

            if (Object.keys(errors).length === 0) {
                await productSchema.validate(productDataTypeCorrected);
                if (status === 'update') {
                    handleUpdateProduct()
                }
                if (status === 'create') {
                    handleAddProduct()
                }
            } else {
                setErrors(errors)
                dispatch(addNotification({ title: 'error', message: 'Ocurrio un errorr', type: 'error' }))
                return Promise.reject(new Error('error'))
            }
        } catch (error) {
            setErrors(errors)
            dispatch(addNotification({ title: 'error', message: 'Error 2c', type: 'error' }))
            return Promise.reject(new Error('error'))
        }
    }
    
    const closeModal = () => {
        dispatch(closeModalUpdateProd())
        dispatch(clearUpdateProductData())
    }

    const localUpdateImage = (url) => dispatch(ChangeProductImage(url));

    const [image] = useImageFallback(product?.productImageURL, noImage)
    return (
        <Modal
            nameRef={updateMode === status ? `Actualizar ${product.id} ` : 'Agregar Producto'}
            isOpen={isOpen}
            close={closeModal}
            btnSubmitName='Guardar'
            handleSubmit={handleSubmit}
            width={'large'}
            subModal={
                <UploadImg
                    fnAddImg={localUpdateImage}
                    isOpen={imgController}
                    setIsOpen={setImgController}
                />
            }
        >
            <Container>
                <FormGroup column='1'>
                    <InputV4
                        name='productName'
                        label={'Nombre del producto:'}
                        required
                        type="text"
                        onClear={() => dispatch(setProduct({ ...product, productName: '' }))}
                        errorMessage={errors?.productName}
                        validate={errors?.productName}
                        value={product?.productName || ''}
                        onChange={(e) => dispatch(setProduct({ ...product, productName: e.target.value }))}
                    />
                </FormGroup>
                <FormGroup column='2'>
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
                        label={'Ordenar por: '}
                        name='order'
                        required
                        value={product?.order}
                        onChange={(e) => dispatch(setProduct({ ...product, order: e.target.value }))}
                    />

                </FormGroup>
                <FormGroup column='3'>
                    <InputV4
                        label={'Tamaño: '}
                        type="text"
                        name="size"
                        placeholder='Contenido Neto:'
                        value={product?.size}
                        onChange={(e) => dispatch(setProduct({ ...product, size: e.target.value }))}
                    />
                    <select
                        name="category: "
                        id=""
                        onChange={(e) => dispatch(setProduct({ ...product, category: e.target.value }))}>                        <option value="">Categoría</option>
                        {
                            categories.length > 0 ? (
                                categories.map((item, index) => (
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
                        label={'Contenido neto: '}
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
                                src={image}
                                style={product?.productImageURL === image ? { objectFit: "cover" } : { objectFit: "contain" }} alt=""
                            />
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
                <FormGroup column='3' >
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
                <FormGroup column='3'>
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
                <FormGroup >
                    <BarCodeControl
                        product={product}
                        value={product?.barCode}
                    />
                </FormGroup>
                <FormGroup >
                    <QRCodeControl
                        product={product}
                        value={product?.qrCode}
                    />
                </FormGroup>
            </Container>

        </Modal>
    )
}

const Container = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr) 240px;
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
    width: 100%;
    display: grid;
    select{
         padding: 0 0.4em;
         border-radius: var(--border-radius-light);
         border: var(--border-primary);
         height: 2em;       
         
      }
 
    &:nth-child(4){
        grid-column: 3 / 4;
        grid-row: 1 / 3; 
    }
    /* &:nth-child(6){
      
        grid-row: 5 / 5; 
    } */
   &:nth-child(7){
       grid-column: 3 / 4;
       grid-row: 3 / 5; 
   }
   &:nth-child(8){
       grid-column: 3 / 4;
       grid-row: 5 / 7; 
     
   }
    ${(props) => {
        switch (props.column) {
            case '1':
                return `
                grid-template-columns: repeat(1, 1fr);
                grid-column: 1 / 3;
                `
            case '2':
                return `
                grid-template-columns: repeat(2, 1fr);
                grid-column: 1 / 3;
                gap: 0.4em;
                `
            case '3':
                return `
                grid-column: 1 / 3;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.4em;
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

