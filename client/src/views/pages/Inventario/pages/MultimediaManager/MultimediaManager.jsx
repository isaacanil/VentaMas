import { nanoid } from 'nanoid'
import React, { useState } from 'react'
import { useEffect } from 'react'
import { IoMdClose, IoMdTrash } from 'react-icons/io'
import { MdClose, MdOutlineFileUpload } from 'react-icons/md'
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
        <h2>Multimedia Manager</h2>
        <ButtonGroup>
          {
            ImgToUpload ? (
              <Button
                title={<IoMdClose />}
                borderRadius='normal'
                width='icon32'
                onClick={() => setImgToUpload(null)}
                bgcolor='error' />) : null
          }
          <AddFileBtn
            title="Imagen"
            fn={() => handleUploadImg()}
            setFile={setImgToUpload}
            file={ImgToUpload}
            startIcon={<MdOutlineFileUpload />}
            id="addImg"
          />
          <Button
            title='subir'
            borderRadius='normal'
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
                <Img key={index}>
                  <div className='head'>
                    <Button
                      title={<IoMdTrash />}
                      borderRadius='normal'
                      width='icon24'
                      bgcolor={'error'}
                      onClick={() => useDeleteImgFBStorage(img)}
                   
                    />
                  </div>
                  <img src={img.url} alt="" onClick={() => useDeleteImgFBStorage(img)} />
                </Img>
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
  h2{
    font-size: 1.2em;
    margin: 0;
  }
`
const Body = styled.div`
  background-color: var(--icolor4);
  display: grid;

`
const BodyWrapper = styled.div`
  display: grid;
  justify-content: center;
  justify-items: center;
  width: 100%;
  padding: 1em;
  overflow: hidden;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  grid-auto-rows:  130px;
  gap: 0.1em;
  
`
const Img = styled.div`
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  padding: 0.2em;
  width: 100%;
    position: relative;
  .head{
      padding: 0  0.2em 0.2em;
      width: auto;
      border-bottom-left-radius: 10px;
      position: absolute;
      right: 0;
      background-color: white;
      display: flex;
      justify-content: flex-end;
      //box-shadow: 2px 10px 10px rgba(0, 0, 0, 0.200);
    }
    img{
      object-fit: cover;
      border-radius: 4px;

      width: 100%;
      height: 100%;
    }
  
`
