// Candidate for deletion: no current modules import this multi display control view.
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { PlusIcon } from '@/assets/system/plus/plusIcon';

import Style from './MultiDisplayControl.module.scss';

export const MultiDisplayControl = () => {
  const [isOpen] = useState(false);
  // numero de pantallas

  const [list, setList] = useState<number[]>([1]);

  const upgradeList = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    //Ultimo elemento
    const lastItem = list.at(-1);
    //condicion para dejar de añadir siempre y cuando este por debajo de 5
    if (typeof lastItem === 'number' && lastItem < 8) {
      const newItem = lastItem + 1;

      setList([...list, newItem]);
    }
    if (lastItem === 8) {
      alert('ya excediste el numero de pantallas');
    }
  };

  return (
    <div
      className={
        isOpen ? `${Style.Container} ${Style.Open}` : `${Style.Container}`
      }
    >
      <ul className={Style.Items}>
        <button
          onClick={upgradeList}
          className={`${Style.Item} ${Style.AddBtn}`}
        >
          <PlusIcon></PlusIcon>
        </button>
        {list.map((item, index) => (
          <li key={index} className={Style.Item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};
