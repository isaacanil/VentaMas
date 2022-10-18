import React, { useState } from 'react'
import styled from 'styled-components'
import style from './CustomizableProductModalStyle.module.scss'
import {AddProduct} from '../AddProduct/AddProduct'
export const CustomizableProductModal = () => {
    const [isHalfSelected, setIsHalfSelected] = useState(false)
    //console.log(isHalfSelected)
    const prueba = (data) => {
        const isHalf = data
        data === 'false' ? setIsHalfSelected(false) : null;
        data === 'true' ? setIsHalfSelected(true) : null;

        console.log(isHalfSelected)
    }
    return (
        <AddProduct/>
        // <div className={style.Backdrop}>
        //     <div className={style.Modal}>
        //         <div className={style.Head}>

        //             <div className={style.row}>
        //                 <div className={style.Group}>
        //                     <h4>Porción</h4>
        //                     <select name="" id="" onChange={(e) => prueba(e.target.value)}>
        //                         <option value={false} >Completa</option>
        //                         <option value={true} >Mitad</option>
        //                     </select>
        //                 </div>
        //                 <div className={style.Group}>
        //                     <h4>Tamaño</h4>
        //                     <select name="" id="">
        //                         <option value="">Familiar</option>
        //                         <option value="">Grande</option>
        //                         <option value="">Mediana</option>
        //                         <option value="">Personal</option>
        //                     </select>
        //                 </div>


        //             </div>
        //             <div className={style.row}>
        //                 <div className={style.Group}>
        //                     <select name="" id="">
        //                         <option value="">Pollo</option>
        //                         <option value="">Jamón y queso</option>
        //                         <option value="">maíz</option>
        //                         <option value="">Pepperoni</option>
        //                         <option value="">Vegetales</option>
        //                         <option value="">Pollo</option>
        //                         <option value="">Completa</option>
        //                     </select>
        //                 </div>
        //                 {
        //                     isHalfSelected ? (
        //                         <div className={style.Group}>
        //                             <select name="" id="">
        //                                 <option value="">Pollo</option>
        //                                 <option value="">Jamón y queso</option>
        //                                 <option value="">maíz</option>
        //                                 <option value="">Pepperoni</option>
        //                                 <option value="">Vegetales</option>
        //                                 <option value="">Pollo</option>
        //                                 <option value="">Completa</option>
        //                             </select>
        //                         </div>
        //                     ) : null
        //                 }



        //             </div>
        //         </div>
        //         <div className={style.Body}>

        //             <h4>Ingredientes Extras</h4>
        //             <div className={style.ExtraIngredientList}>
        //                 <div className={style.Wrapper}>
        //                     <div className={style.Item}>
        //                         <input type="checkbox" name="" id="" />
        //                         <label htmlFor="">nombre Ingrediente</label>
        //                     </div>
        //                     <div className={style.Item}>
        //                         <input type="checkbox" name="" id="" />
        //                         <label htmlFor="">nombre Ingrediente</label>
        //                     </div>
        //                     <div className={style.Item}>
        //                         <input type="checkbox" name="" id="" />
        //                         <label htmlFor="">nombre Ingrediente</label>
        //                     </div>
        //                     <div className={style.Item}>
        //                         <input type="checkbox" name="" id="" />
        //                         <label htmlFor="">nombre Ingrediente</label>
        //                     </div>
        //                     <div className={style.Item}>
        //                         <input type="checkbox" name="" id="" />
        //                         <label htmlFor="">nombre Ingrediente</label>
        //                     </div>
        //                 </div>
        //             </div>
        //         </div>
        //         <div className={style.Footer}>

        //         </div>
        //     </div>
        // </div>
    )
}
