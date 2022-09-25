import React, {useState} from 'react'
import {
  //template
  MenuApp as Menu,



} from '../../index'
import { UploadProdImg, UploadProdData } from '../../../firebase/firebaseconfig'

export const Compras = () => {
  const [img, setImg] = useState()
  //console.log(img)
  const handleSubmit = () => {
    UploadProdImg(img).then((url) => UploadProdData(url))
  }
  return (
    <div>
      {/* modals */}


      <Menu></Menu>
      <h2>compra</h2>
      <input type="file" name="" id="" onChange={e => setImg(e.target.files[0])} />
      <button onClick={() => handleSubmit()}>Prueba</button>


    </div>
  )
}

