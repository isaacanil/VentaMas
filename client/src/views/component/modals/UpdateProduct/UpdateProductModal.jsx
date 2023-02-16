import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { closeModalUpdateProd } from '../../../../features/modals/modalSlice'
import { ChangeProductImage, clearUpdateProductData, selectUpdateProductData } from '../../../../features/updateProduct/updateProductSlice'
import { getCat, getTaxes, updateProduct } from '../../../../firebase/firebaseconfig'
import { parseToString } from '../../../../hooks/parseToString'
import { Button } from '../../../templates/system/Button/Button'
import { Input } from '../../../templates/system/Inputs/InputV2'
import { UploadImg } from '../../UploadImg'
import { Modal } from '../modal'
import { quitarCeros } from '../../../../hooks/quitarCeros'
import { useDecimalLimiter } from '../../../../hooks/useDecimalLimiter'
import { MdRadioButtonChecked, MdRadioButtonUnchecked } from 'react-icons/md'
const EmptyProduct = {
    productName: "",
    cost: {
        unit: 0,
        total: 0
    },
    amountToBuy: { unit: 1, total: 1 },
    productImageURL: undefined,
    category: undefined,
    stock: "",
    type: "",
    size: "",
    netContent: "",
    tax: {
        unit: 0,
        ref: 'Excento',
        value: 0,
        total: 0
    },
    available: "", // disponibilidad producto
    initialCost: "", // costo producción
    surcharge: "", // recargo adicional
    salePrice: "", // precio venta
    profit: "", // ganancia neta
    profitMargin: "", // margen ganancia
    description: "", // descripción producto
    rating: "", // valoración producto
    reviews: "", // reseñas producto
    shipping: "", // envío producto
    seller: "", // vendedor producto
    warranty: "", // garantía producto
    barcode: "", // código barras
    id: "",
    trackInventory: false,
    order: 0,
    margin: "",
    price: {
        unit: 0,
        total: 0
    }
}
export const UpdateProductModal = ({ isOpen }) => {
    const { status, lastProduct } = useSelector(selectUpdateProductData)
    const [taxesList, setTaxesList] = useState([])
    const [taxRef, setTaxRef] = useState('')
    const [catList, setCatList] = useState([])
    const [imgController, setImgController] = useState(false)
    const [product, setProduct] = useState(EmptyProduct)
    const dispatch = useDispatch()

    const handleImgController = (e) => {
        e.preventDefault()
        setImgController(!imgController)
    }

    useEffect(() => {
        setProduct(
            {
                ...product,
                id: lastProduct.id,
                productName: lastProduct.productName,
                cost: lastProduct.cost,
                productImageURL: parseToString(lastProduct.productImageURL),
                category: parseToString(lastProduct.category),
                stock: parseToString(lastProduct.stock),
                netContent: parseToString(lastProduct.netContent),
                tax: lastProduct.tax,
                price: lastProduct.price,
                trackInventory: lastProduct.trackInventory,
                order: parseToString(lastProduct.order),
                size: parseToString(lastProduct.size),
                type: parseToString(lastProduct.type),
                amountToBuy: { unit: 1, total: 1 },

            }
        )
    }, [lastProduct])

    useEffect(() => {
        getTaxes(setTaxesList)
        getCat(setCatList)
    }, [])
    const calculatePrice = () => {
        const { cost, tax } = product;
        if (typeof cost.unit !== 'number' || typeof tax.value !== 'number') { return }
        const price = {
            unit: cost.unit * tax.value + cost.unit,
            total: cost.unit * tax.value + cost.unit,
        }
        setProduct({ ...product, price })
    }

    useEffect(calculatePrice, [product.cost, product.tax])

    const handleSubmitAddProducts = () => {
        updateProduct(product)
        closeModal()
        dispatch(clearUpdateProductData())
    }

    const closeModal = () => {
        dispatch(closeModalUpdateProd())
        dispatch(clearUpdateProductData())
    }

    const localUpdateImage = (url) => {
        dispatch(ChangeProductImage(url))
    }
    console.log(product)

    return (
        <Modal
            nameRef='Actualizar'
            isOpen={isOpen}
            close={closeModal}
            btnSubmitName='Guardar'
            handleSubmit={handleSubmitAddProducts}
            subModal={
                <UploadImg
                    fnAddImg={localUpdateImage}
                    isOpen={imgController}
                    setIsOpen={setImgController}
                />
            }
        >
            <Container>
                <Group column='2'>
                    <Input
                        required
                        title={'Nombre del producto'}
                        type="text"
                        value={status ? product.productName : undefined}
                        placeholder='Nombre del Producto:'
                        onChange={(e) => setProduct({
                            ...product,
                            productName: e.target.value
                        })} />
                </Group>
                <Group orientation='vertical'>
                    <Input
                        title={'Tipo de Producto'}
                        type="text"
                        value={status ? product.type : undefined}
                        onChange={(e) => setProduct({
                            ...product,
                            type: e.target.value
                        })}

                    />
                    <Input
                        title={'Stock'}
                        type="number"
                        placeholder='stock'
                        value={status ? product.stock : undefined}
                        onChange={(e) => setProduct({
                            ...product,
                            stock: e.target.value
                        })} />
                </Group>
                <Group orientation='vertical'>
                    <Input
                        title={'Contenido neto'}
                        type="text"
                        placeholder='Contenido Neto:'
                        value={status ? product.netContent : undefined}
                        onChange={(e) => setProduct({
                            ...product,
                            netContent: e.target.value
                        })} />
                    <select name="select" id="" onChange={(e) => setProduct({
                        ...product,
                        category: e.target.value
                    })}>
                        <option value="">Categoría</option>
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
                </Group>
                <Group>
                    <Img>
                        <img src={status ? product.productImageURL : undefined} alt="" />
                    </Img>
                    <Button
                        borderRadius='normal'
                        width='w100'
                        title='Agregar Imagen'
                        bgcolor='primary'
                        titlePosition='center'
                        onClick={handleImgController}
                    />
                </Group>
                <Group orientation='vertical'>
                    <Input
                        title={'Tamaño'}
                        type="text"
                        placeholder='Contenido Neto:'
                        value={status ? product.size : undefined}
                        onChange={(e) => setProduct({
                            ...product,
                            size: e.target.value
                        })}
                    />
                    <Input
                        size='small'
                        type="text"
                        title={'Order'}
                        value={status ? product.order : undefined}
                        onChange={(e) => setProduct({
                            ...product,
                            order: Number(e.target.value)
                        })}
                    />
                    <Button
                        borderRadius={'normal'}
                        title={'Invetariable'}
                        //border={'light'}
                        isActivated={product.trackInventory ? true : false}
                        iconOn={<MdRadioButtonChecked />}
                        iconOff={<MdRadioButtonUnchecked />}
                        onClick={() => setProduct({
                            ...product,
                            trackInventory: !product.trackInventory
                        })}
                    />
                </Group>
                <Group orientation='vertical'>
                    <Input
                        title={'Costo'}
                        type="number"
                        value={status ? quitarCeros(product.cost.unit) : undefined}
                        onChange={(e) => setProduct({
                            ...product,
                            cost: {
                                unit: Number(e.target.value),
                                total: Number(e.target.value)
                            }
                        })} />
                    <select id="" onChange={(e) => setProduct({
                        ...product,
                        tax: JSON.parse(e.target.value)
                    })}>
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
                    <Input
                        type="number"
                        title={'Precio + ITBIS'}
                        value={status ? product.price.unit : undefined}
                        readOnly
                        placeholder='Precio de Venta' />
                </Group>
            </Container>G
        </Modal>
    )
}

const Container = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 2em 1em 1em;
    background-color: #fff;
    height: 100%;
    width: 100%;
    gap: 1.7em;
    align-content: flex-start;
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }    
`
const Group = styled.div`

    select{
         padding: 0 0.4em;
         border-radius: var(--border-radius-light);
         border: none;
         outline: 1px solid rgb(145, 145, 145);
      }
    &:nth-child(1){
        grid-column: 2 span;
    }
    &:nth-child(2){
        grid-column: 1 / 3;
    }
    &:nth-child(3){ 
        grid-column: 1 / 3;
    }
    &:nth-child(4){
        //background-color: #cce1e9;
        //padding: 6px;
        padding: 0;
        border-radius: var(--border-radius-light);
        //border: 1px solid rgba(2, 2, 2, 0.100);
        img{
            width: 100%;
            height: 100px;
            object-fit: cover;
            border-radius: var(--border-radius-light);
        }
        grid-column: 3 / 4;
        grid-row: 1 / 4;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
       
        
       // justify-content: center;
        justify-items: center;
    }
    &:nth-child(5){
        grid-column: 1 / 4;
    }
    &:nth-child(6){
       grid-column: 1 / 4;
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
const Img = styled.div`
background-color: white;
border-radius: 8px;
overflow: hidden;
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