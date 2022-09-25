import React, { useState } from 'react'
import Style from './MultiDisplayControl.module.scss'
import {PlusIcon} from '../../../assets/index'

export const MultiDisplayControl = () => {
  const [isOpen, SetIsOpen] = useState(false)
  // numero de pantallas

  const [list, setList] = useState([1])

  const upgradeList = (e) => {
    e.preventDefault()
    //Ultimo elemento 
    const lastItem = list.at(-1);
    //condicion para dejar de añadir siempre y cuando este por debajo de 5
    if (lastItem < 5) {
      const newItem = lastItem + 1;

      setList([...list, newItem])
    }
    if(lastItem > 4){
      alert('ya excediste el numero de pantallas')
    }
    

    console.log(list)
  }


  return (

    <div className={ isOpen ? `${Style.Container} ${Style.Open}` : `${Style.Container}`}>

      <ul className={Style.Items}>
        {

          list.map((item, index) =>

            <li key={index} className={Style.Item}>
             
                {item}
             
            </li>


          )
        }
        <button onClick={upgradeList} className={`${Style.Item} ${Style.AddBtn}`}>
          <PlusIcon></PlusIcon>
        </button>
      </ul>


    </div>
  )
}


