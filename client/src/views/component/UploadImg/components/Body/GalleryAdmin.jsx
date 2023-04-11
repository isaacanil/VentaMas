import React from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { ChangeProductImage } from '../../../../../features/updateProduct/updateProductSlice'
import { fbAddProductImg } from '../../../../../firebase/products/fbAddProductImg'
export const GalleryAdmin = ({images, setImg}) => {
    const dispatch = useDispatch()
    const AddImg = (img) => {
      dispatch(ChangeProductImage(img))
    }
    return (
        <Container>
            <Header>
                <h2>Elige una img</h2>
            </Header>
            <Body>
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
            </Body>
        </Container>
    )
}

const Container = styled.div`
    background-color: #fafafa;
    border-radius: 8px;
    display: grid;
    align-items: stretch;
    gap: 0.8em;
    overflow-y: hidden;
    padding: 0.4em;
    `
const Header = styled.div`
    h2{
        margin:  0;
        font-size: 18px;
    }
    `
const Body = styled.div`
    background-color: var(--White3);
    border-radius: var(--border-radius);
    display: grid;
    grid-template-rows: 1fr;
    margin: 0;
    padding: 0.4em;
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
        background-color: white;
        img{
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
    `
