import { nanoid } from 'nanoid'
import React, { useState } from 'react'
import { useEffect } from 'react'
import { IoMdClose } from 'react-icons/io'
import { IoOptionsOutline } from 'react-icons/io5'
import { MdOutlineFileUpload } from 'react-icons/md'
import styled from 'styled-components'
import { ProductsImg, UploadProdImg, UploadProdImgData } from '../../../../../firebase/firebaseconfig'
import { useDeleteImgFBStorage } from '../../../../../hooks/useDeleteImgFBStorage'
import { MenuApp } from '../../../../templates/MenuApp/MenuApp'
import { AddFileBtn } from '../../../../templates/system/Button/AddFileBtn'
import { Button, ButtonGroup } from '../../../../templates/system/Button/Button'

export const MultimediaManager = () => {
  const [allImg, setAllImg] = useState([])
  const [ImgToUpload, setImgToUpload] = useState(null)
  useEffect(() => {
    ProductsImg(setAllImg)
  }, [])
  const setId = () => {
    return new Promise((resolve, reject) => {
      resolve(nanoid(7))
    })
  }
  console.log(ImgToUpload)
  const handleSubmit = () => {
    setId().then((id) => {
      UploadProdImg(ImgToUpload).then((url) => {
        UploadProdImgData(id, url)
        setImgToUpload(null)
      })
    })
  }

  return (
    <Container>
      <MenuApp></MenuApp>
      <Head>
        <h1>Multimedia Manager</h1>
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
            title="Agregar Imagen"
            fn={() => handleUploadImg()}
            setFile={setImgToUpload}
            file={ImgToUpload}
            startIcon={<MdOutlineFileUpload />}
            id="addImg"
          />
          <Button
            title='subir'
            onClick={handleSubmit}
            bgcolor='primary'
            disabled={ImgToUpload ? false : true}
          />
        </ButtonGroup>
      </Head>
      <Body>
        <BodyWrapper>
          {
            allImg.length > 0 ? (
              allImg.map((img, index) => (
                <div key={index}>
                  <div className='head'>
                    <Button
                      title={<IoOptionsOutline />}
                      width='icon32'
                      bgcolor='dark'
                   
                    />
                  </div>
                  <img src={img.url} alt="" onClick={() => useDeleteImgFBStorage(img)} />
                </div>
              ))
            ) : null
          }
        </BodyWrapper>
      </Body>
    </Container>
  )
}
const Container = styled.div`
  height: 100vh;
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  grid-template-columns: 1fr;
`
const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 2.5em;
  padding: 0 1.3em;
  h1{
    font-size: 1.3em;
    margin: 0;
  }
`
const Body = styled.div`
  background-color: #dfdfdf;
  display: grid;

`
const BodyWrapper = styled.div`
  display: grid;
  justify-content: center;
  justify-items: center;
  width: 100%;
  padding: 1em;
  overflow: hidden;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  grid-auto-rows:  150px;
  gap: 1em;
  
  div{
    width: 100%;
    position: relative;
    .head{
      padding: 0.2em 0.2em;
      width: 100%;
      position: absolute;
      display: flex;
      justify-content: flex-end;
    }
    
    img{
      object-fit: cover;
      box-shadow: 2px 10px 10px rgba(0, 0, 0, 0.400);
      border-radius: 8px;
      width: 100%;
      height: 100%;
    }
  }
`
