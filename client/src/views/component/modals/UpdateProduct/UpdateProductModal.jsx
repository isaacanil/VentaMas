import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { closeModalUpdateProd } from '../../../../features/modals/modalSlice'
import { ChangeProductData, ChangeProductImage, clearUpdateProductData, selectUpdateProductData, setProduct } from '../../../../features/updateProduct/updateProductSlice'
import { getTaxes } from '../../../../firebase/firebaseconfig'
import { Button } from '../../../templates/system/Button/Button'
import { UploadImg } from '../../UploadImg/UploadImg'
import { Modal } from '../Modal'
import { fbUpdateProduct } from '../../../../firebase/products/fbUpdateProduct'
import { InventariableButton } from './components/Buttons/InventariableButton'
import { productDataTypeCorrection } from '../../../../features/updateProduct/validateProductDataType'
import { productSchema } from '../../../../features/updateProduct/productSchema'
import { InputV4 } from '../../../templates/system/Inputs/GeneralInput/InputV4'
import { useFormatNumber } from '../../../../hooks/useFormatNumber'
import noImage from '../../../../assets/producto/noImg.png'
import { OPERATION_MODES } from '../../../../constants/modes'
import { fbAddProduct } from '../../../../firebase/products/fbAddProduct'
import { initTaxes } from './InitializeData'
import { selectUser } from '../../../../features/auth/userSlice'
import { BarCodeControl } from './components/BarCodeControl/BarCodeControl'
import { QRCodeControl } from './components/QRCodeControl/QRCodeControl'
import { useFbGetCategories } from '../../../../firebase/categories/useFbGetCategories'
import useImageFallback from '../../../../hooks/image/useImageFallback'
import { ProductVisibilityButton } from './components/Buttons/ProductVisibilityButton'
import { addNotification } from '../../../../features/notification/notificationSlice'

import { Select } from '../../../templates/system/Select/Select'
import Typography from '../../../templates/system/Typografy/Typografy'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'
import { useCallback } from 'react'
import ProductPaymentDetails from './components/ProductPaymentdetails/ProductPaymentDetails'

function interpretLayoutString(layoutString) {
    if (!layoutString) return {};

    return {
        gridTemplateColumns: layoutString,
    };
}

const validateProduct = (product) => {
    let errors = {};

    const costUnit = Number(product.cost.unit);
    const taxValue = Number(product.tax.value);
    const priceUnit = Number(product.price.unit);
    const taxAndCost = (costUnit * taxValue) + costUnit;

    if (!product.productName) {
        errors.productName = 'Nombre del producto es requerido.';
    }
    if (!product.type) {
        errors.type = 'Tipo de producto es requerido.';
    }
    if (product.value && product.tax.value < 0) {
        errors.tax = 'Impuesto es requerido.';
    }
    if (!product.cost.unit) {
        errors.cost = 'Costo es requerido.';
    }
    if (taxAndCost > priceUnit) {
        errors.price = 'El precio no puede ser menor a la suma del (costo + impuesto).'
    }
    return errors;
}
export const UpdateProductModal = ({ isOpen }) => {
    const { status, product } = useSelector(selectUpdateProductData);
    const [taxesList, setTaxesList] = useState(initTaxes);

    const [imgController, setImgController] = useState(false)
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const updateMode = OPERATION_MODES.UPDATE.label;

    const handleImgController = () => setImgController(!imgController);

    const [errors, setErrors] = useState({})

    useEffect(() => { getTaxes(setTaxesList) }, [])

    const { categories } = useFbGetCategories()
    console.log(categories)
    const productDataTypeCorrected = new productDataTypeCorrection(product);

    const handleUpdateProduct = async () => {
        await fbUpdateProduct(productDataTypeCorrected, dispatch, user);
    }

    const handleAddProduct = () => {
        dispatch(addNotification({ title: 'Producto Creado', message: 'Espere un momento', type: 'success' }))
        fbAddProduct(productDataTypeCorrected, dispatch, user)
    }

    const handleSubmit = useCallback(async () => {
        const errors = validateProduct(product);
        try {
            if (Object.keys(errors).length === 0) {
                await productSchema.validate(productDataTypeCorrected);
                if (status === 'update') handleUpdateProduct();
                if (status === 'create') handleAddProduct();
                
            } else {
                setErrors(errors)
                const getErrors = Object.values(errors);
                dispatch(addNotification({ title: 'error', message: getErrors, type: 'error' }))
                return Promise.reject(new Error('error'))
            }
        } catch (error) {
            setErrors(errors)
            dispatch(addNotification({ title: 'error', message: 'Error: ' + error, type: 'error' }));
            return Promise.reject(new Error('error'));
        }
    }, [product, status])

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
                <Main>
                    <Section>
                        <Typography
                            variant='h3'
                        >
                            Información del producto
                        </Typography>
                        <FormGroup layout='1fr'>
                            <InputV4
                                name='productName'
                                label={'Nombre del producto:'}
                                required
                                size={'medium'}
                                type="text"
                                onClear={() => dispatch(setProduct({ ...product, productName: '' }))}
                                errorMessage={errors?.productName}
                                validate={errors?.productName}
                                value={product?.productName || ''}
                                onChange={(e) => dispatch(setProduct({ ...product, productName: e.target.value }))}
                            />
                        </FormGroup>
                        <FormGroup layout='1fr 1fr'>
                            <InputV4
                                label={'Tipo de Producto:'}
                                type="text"
                                name='type'
                                size={'medium'}
                                required
                                value={product?.type || ''}
                                onChange={(e) => dispatch(setProduct({ ...product, type: e.target.value }))}
                            />
                            <InputV4
                                label={'Contenido neto: '}
                                type="text"
                                placeholder='Contenido Neto:'
                                name='netContent'
                                size={'medium'}
                                value={product?.netContent || undefined}
                                onChange={(e) => dispatch(setProduct({ ...product, netContent: e.target.value }))}
                            />
                        </FormGroup>
                        <FormGroup layout='1fr 1fr'>
                            <InputV4
                                label={'Tamaño: '}
                                type="text"
                                name="size"
                                size={'medium'}
                                placeholder='Contenido Neto:'
                                value={product?.size}
                                onChange={(e) => dispatch(setProduct({ ...product, size: e.target.value }))}
                            />
                            <Select
                                labelVariant='label1'
                                title={'Categoría'}
                                data={categories}
                                value={product?.category}
                                onChange={(e) => dispatch(setProduct({ ...product, category: e.target.value?.category?.name }))}
                                displayKey={'category.name'}
                            />
                        </FormGroup>
                    </Section>
                    <Section>
                        <Typography
                            variant='h3'
                        >
                            Gestión Inventario
                        </Typography>
                        <FormGroup layout='1fr 1fr' >
                            <InventariableButton
                                setProduct={setProduct}
                                product={product}
                            />
                            <InputV4
                                label={'Stock:'}
                                type="number"
                                placeholder='stock'
                                size={'medium'}
                                name='stock'
                                value={product?.stock}
                                onChange={(e) => dispatch(setProduct({ ...product, stock: Number(e.target.value) }))}
                            />
                        </FormGroup>
                    </Section>
                    <Section>
                        <Typography
                            variant='h3'
                        >
                            Facturación y Precio
                        </Typography>
                    
                        <FormGroup layout='1fr 1fr'>
                            <div>
                                <ProductVisibilityButton
                                    product={product}
                                    setProduct={setProduct}
                                />
                                <Select
                                    labelVariant='label1'
                                    title={'Impuesto'}
                                    data={taxesList}
                                    required
                                    value={"ITBIS " + product?.tax?.ref}
                                    onNoneOptionSelected={() => dispatch(setProduct({
                                        ...product,
                                        tax: initTaxes[0].tax
                                    }))
                                    }
                                    onChange={(e) => {
                                        console.log(e.target.value)
                                        dispatch(setProduct({
                                            ...product,
                                            tax: e.target.value?.tax
                                        }))
                                    }}
                                    displayKey={'tax.ref'}
                                />
                                <InputV4
                                    label={'Costo'}
                                    type="number"
                                    size={'medium'}
                                    required
                                    value={product?.cost?.unit}
                                    onChange={(e) => dispatch(setProduct({ ...product, cost: { ...product.cost, unit: Number(e.target.value), total: Number(e.target.value) } }))}
                                />
                                <InputV4
                                    size={'medium'}
                                    required
                                    label={'Precio + ITBIS'}
                                    value={status ? product.price.unit : undefined}
                                    type={"number"}
                                    errorMessage={errors?.price}
                                    validate={errors?.price}
                                    onChange={(e) => dispatch(setProduct({ ...product, price: { ...product.price, unit: Number(e.target.value), total: Number(e.target.value) } }))}
                                    placeholder='Precio de Venta'
                                />
                            </div>
                            <ProductPaymentDetails product={product} />
                         
                        </FormGroup>
                    </Section>
                </Main>
                <Aside>
                    <FormGroup>
                        <ImgContainer>
                            <Img>
                                <img
                                    src={image}
                                    style={product?.productImageURL === image ?
                                        { objectFit: "cover" } :
                                        { objectFit: "contain", padding: "2em" }
                                    } alt=""
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
                </Aside>
            </Container>
        </Modal>
    )
}

const Container = styled.div`
    display: grid;
    grid-template-columns: 1fr 300px;
    padding: 1em;
    background-color: var(--White2);
    height: 100%;
    width: 100%;
    gap: 0.6em;
   
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }    
`
const Aside = styled.div`
  display: grid;
    gap: 2em;
    background-color: white;
    padding: 1em;
    border-radius: var(--border-radius-light);
`

const Main = styled.div`
    display: grid;
    gap: 0.6em;
`

const Section = styled.div`
    background-color: white;
    padding: 1em;
    border-radius: var(--border-radius-light);
    display: grid;
    gap: 0.6em;
`

const FormGroup = styled.div`
 
    background-color: var(--White);
    border-radius: var(--border-radius-light);
    width: 100%;
    display: flex;
 
    /* ${(props) => {
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
    }} */
    ${(props) => {
        const style = interpretLayoutString(props.layout);
        return `
            display: grid;
            gap: 1em;
            grid-template-columns: ${style.gridTemplateColumns || '1fr'};
            jus
          
        `;
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
height: 160px;
img{
    width: 100%;
    height: 100%;
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

