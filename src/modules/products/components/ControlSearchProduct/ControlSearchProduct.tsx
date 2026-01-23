import { Fragment } from 'react';
import { useMatch } from 'react-router-dom';

import { Carrusel } from '@/modules/products/components/Carrusel/Carrusel';

import Style from './ProductControl.module.scss';

import type { JSX } from 'react';

export const ControlSearchProduct = (): JSX.Element => {
  const matchWithInventory = useMatch('/app/inventario/items');
  const matchWithVenta = useMatch('/app/venta/:id');

  return (
    <Fragment>
      <div className={Style.Container}>
        {matchWithVenta ? <Carrusel themeColor={null} /> : null}
        {matchWithInventory ? <Fragment></Fragment> : null}
      </div>
    </Fragment>
  );
};
