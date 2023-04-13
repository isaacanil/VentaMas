import React, { useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { MdOutlineFileUpload } from 'react-icons/md'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { selectUpdateProductData } from '../../../../../features/updateProduct/updateProductSlice'
import { UploadProdImgData } from '../../../../../firebase/firebaseconfig'
import { fbAddProductImg } from '../../../../../firebase/products/fbAddProductImg'
import { AddFileBtn } from '../../../../templates/system/Button/AddFileBtn'
import { Button, ButtonGroup } from '../../../../templates/system/Button/Button'
import noImg from '../../../../../assets/producto/noImg.png'
export const UploadImgAdmin = ({ ImgToUpload, setImgToUpload, img }) => {
   
    const handleSubmit = () => {
        fbAddProductImg(ImgToUpload)
            .then((url) => {
                UploadProdImgData(url)
                setImgToUpload(null)
            })
    }

    return (
        <Container>
            <div className='uploadImg'>
                <h2>Subir Imagen</h2>
                <br />
                <ButtonGroup>
                    {
                        ImgToUpload &&
                        <Button
                            borderRadius='normal'
                            title={<IoMdClose />}
                            width='icon32'
                            onClick={() => setImgToUpload(null)}
                            bgcolor='error'
                        />
                    }
                    <AddFileBtn
                        title="Agregar"
                        setFile={setImgToUpload}
                        file={ImgToUpload}
                        startIcon={<MdOutlineFileUpload />}
                        id="addImg"
                    />
                    <Button
                        title='subir'
                        borderRadius='normal'
                        bgcolor='primary'
                        onClick={handleSubmit}
                        disabled={ImgToUpload ? false : true}
                    />
                </ButtonGroup>
            </div>
            <ImgContainer>
                <img src={img || noImg} alt="" />
            </ImgContainer>
        </Container>
    )
}

const Container = styled.div`
box-sizing: border-box;
h2{
    margin: 0;
    font-size: 18px;
}
height: 100%;
background-color: #fafafa;
display: grid;
padding: 0.4em 0.4em 0.4em 0.8em;
grid-template-columns: 1fr min-content;
border-radius: 8px;
position: relative;

            
        
`
const ImgContainer = styled.div`

align-self: center;
max-height: 5em;
height: 5em;
width: 5em;
background-color: #fff;
border-radius: 8px;
overflow: hidden;
img{
    object-fit: cover;
    object-position: center;
    height: 100%;
    width: 100%;
}
            
`