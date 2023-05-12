import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { selectUpdateProductData } from '../../../../../features/updateProduct/updateProductSlice'
import { GalleryAdmin } from './GalleryAdmin'
import { UploadImgAdmin } from './UploadImgAdmin'

export const Body = ({images, ImgToUpload, setImgToUpload}) => {
    const { status, product } = useSelector(selectUpdateProductData)
    const [img, setImg] = useState(product?.productImageURL)
    return (
        <Container>
            <BodyWrapper>
                <UploadImgAdmin ImgToUpload={ImgToUpload} setImgToUpload={setImgToUpload} img={img} />
                <GalleryAdmin images={images} setImg={setImg}/>
            </BodyWrapper>
        </Container>
    )
}

const Container = styled.div`
    overflow: hidden;
    padding: 0 ;
    display: grid;
    grid-template-rows: 1fr;
`
const BodyWrapper = styled.div`
    display: grid;
    gap: 1em; // gap between rows
    margin-bottom: 1em;
    grid-template-rows: min-content 1fr; // this was missing
    overflow: hidden;
`
