import React, { useState } from 'react'
import { IoIosArrowBack, IoMdClose } from 'react-icons/io'
import { MdClose, MdOutlineFileUpload } from 'react-icons/md'
import styled from 'styled-components'
import { Button, ButtonGroup } from '../templates/system/Button/Button'
import noimg from '../../assets/producto/noimg.png'
import { AddFileBtn } from '../templates/system/Button/AddFileBtn'
import { ProductsImg, UploadProdImg, UploadProdImgData } from '../../firebase/firebaseconfig'
import { nanoid } from 'nanoid'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeProductImage, selectUpdateProductData } from '../../features/updateProduct/updateProductSlice'
export const UploadImg = ({ isOpen, setIsOpen, fnAddImg }) => {
    const { status, lastProduct } = useSelector(selectUpdateProductData)
    const [img, setImg] = useState(lastProduct.productImageURL)
    const [ImgToUpload, setImgToUpload] = useState(null)
    const [images, setImages] = useState([])
    const dispatch = useDispatch()
    useEffect(() => {
        ProductsImg(setImages)
    }, [])
    const setId = () => {
        return new Promise((resolve, reject) => {
            resolve(nanoid(7))
        })
    }
    const AddImg = (img) => {
        fnAddImg(img)
    }
    const handleSubmit = () => {
        setId().then((id) => {
            UploadProdImg(ImgToUpload).then((url) => {
                UploadProdImgData(id, url)
                setImgToUpload(null)
            })
        })
    }

    return (
        isOpen ? (
            <Backdrop>
                <Container>
                    <Head>
                        <Button
                            startIcon={<IoIosArrowBack />}
                            title='atrás'
                            onClick={() => setIsOpen(false)}
                        />
                    </Head>
                    <Body>
                        <div className='wrapper'>
                            <div className='head'>
                                <div className='uploadImg'>
                                    <h2>Subir Imagen</h2>
                                    <br />
                                    <ButtonGroup>
                                        {
                                            ImgToUpload ? (
                                                <Button
                                                    title={<IoMdClose />}
                                                    width='icon32'
                                                    onClick={() => setImgToUpload(null)}
                                                    bgcolor='error' />) : null
                                        }
                                        <AddFileBtn
                                            title="Agregar"
                                            fn={() => handleUploadImg()}
                                            setFile={setImgToUpload}
                                            file={ImgToUpload}
                                            startIcon={<MdOutlineFileUpload />}
                                            id="addImg"
                                        />
                                        <Button
                                            title='subir'
                                            bgcolor='primary'
                                            onClick={handleSubmit}
                                            disabled={ImgToUpload ? false : true}
                                        />
                                    </ButtonGroup>
                                </div>
                                <div className='imgContainer'>
                                    <img src={img} alt="" />
                                </div>
                            </div>
                            <GalleryContainer>
                                <GalleryHead>
                                    <h2>Elige una img</h2>
                                </GalleryHead>
                                <GalleryBody>
                                    <div className='wrapper'>
                                        {
                                            images.length > 0 ? (
                                                images.map((img, index) => (
                                                    <div
                                                        className='imgContainer'
                                                        key={index}
                                                        onClick={() => {
                                                            setImg(img.url)
                                                            AddImg(img.url)
                                                        }}>
                                                        <img
                                                            src={img.url}
                                                            alt=""
                                                           />
                                                    </div>
                                                ))
                                            ) : null
                                        }
                                    </div>
                                </GalleryBody>
                            </GalleryContainer>
                        </div>
                    </Body>

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
    grid-template-rows: min-content 1fr;
`
const Head = styled.div`
    height: 2.75em;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
`
const Body = styled.div`
 
    padding: 0 0;
    display: grid;
    grid-template-rows: 1fr;
    .wrapper{
        display: grid;
        gap: 1em;
        margin-bottom: 1em;
        grid-template-rows: min-content 1fr; 
        .head{
            h2{
                margin: 0;
            }
            height: auto;
            background-color: #fafafa;
            display: grid;
    
            padding: 0.4em 0.4em 0.4em 0.8em;
            grid-template-columns: 1fr min-content;
            border-radius: 8px;
            position: relative;
            box-sizing: border-box;
            .imgContainer{
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
            }
        }
    }

`
const GalleryContainer = styled.div`
    background-color: #fafafa;
    border-radius: 8px;
    display: grid;
    align-items: stretch;
    gap: 1em;
    overflow: hidden;
    grid-template-rows: min-content 1fr;
    padding: 0 0;
    height: calc(100vh - 2.75em - 10em);
    
    
    
    `
const GalleryHead = styled.div`
    h2{
        margin: 0.4em 0.6em 0;
    }
    `
const GalleryBody = styled.div`
    background-color: #f3f3f3;
    display: grid;
    grid-template-rows: 1fr;
    margin: 0;
    padding: 0;
    overflow-y: scroll;
    position: relative;
  
    .wrapper{
        padding: 0em 1em;
        margin: 0;
        display: grid;
        justify-items: center;
        justify-content: center;
        align-items: flex-start;
        align-content: flex-start;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        //grid-template-rows: repeat(3, minmax(100px, 1fr));
        grid-auto-rows: min-content;
        gap: 1em;
    
        
     
        
    }
    .imgContainer{
        width: 100px;
        height: 100px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 4px 7px 10px #0000002d;
        background-color: white;
        img{
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
    `
