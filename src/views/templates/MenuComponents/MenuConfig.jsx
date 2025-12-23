import { faBoxes, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { toggleCart } from '@/features/cart/cartSlice';

export const MenuConfig = [
  {
    title: 'Cargar preventa',
    icon: <FontAwesomeIcon icon={faBoxes} />,
    onclick: null, // Will be set dynamically
    align: 'left',
    bgcolor: 'secondary',
    id: 'preorder',
  },
  {
    title: 'Facturar',
    icon: <FontAwesomeIcon icon={faReceipt} />,
    onclick: (dispatch) => {
      dispatch(toggleCart());
    },
    align: 'right',
    bgcolor: 'primary',
  },
];
