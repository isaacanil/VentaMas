import React, { useState } from 'react'
import styled from 'styled-components'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeProductImage, selectUpdateProductData } from '../../../features/updateProduct/updateProductSlice'
import { Header } from './components/Header/Header'
import { Body } from './components/Body/Body'
import { fbGetProductsImg } from '../../../firebase/products/productsImg/fbGetProductsImg'
import { selectUser } from '../../../features/auth/userSlice'
export const UploadImg = ({ isOpen, setIsOpen, fnAddImg }) => {
    const { status, product } = useSelector(selectUpdateProductData)
    const [img, setImg] = useState(product?.productImageURL)
    const [ImgToUpload, setImgToUpload] = useState(null)
    const [images, setImages] = useState([])
    const user = useSelector(selectUser)
    useEffect(() => { fbGetProductsImg(user, setImages) }, [user])

    return (
        isOpen ? (
            <Backdrop>
                <Container>
                    <Header
                        setIsOpen={setIsOpen}
                    />
                    <Body
                        images={images}
                        ImgToUpload={ImgToUpload}
                        setImgToUpload={setImgToUpload}
                    />
                </Container>
            </Backdrop>
        ) : null
    )
}
const Backdrop = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;
`
const Container = styled.div`
    position: relative;
    background-color: #e2e2e2fd;
    display: grid;
    height: 100%;
    width: 100%;
    padding: 0.6em 1em ;
    overflow: hidden;
    z-index: 1;
    grid-template-rows: min-content 1fr;
`

