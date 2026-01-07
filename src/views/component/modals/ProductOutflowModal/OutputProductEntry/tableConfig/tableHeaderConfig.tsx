// @ts-nocheck
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';

import { SelectProductSelected } from '@/features/productOutflow/productOutflow';
import { Button } from '@/views/templates/system/Button/Button';

export const useTableHeaderColumns = ({ Group }) => {
  const productSelected = useSelector(SelectProductSelected);
  const currentQuantity = () => {
    const removed = productSelected?.currentRemovedQuantity;
    const stock = productSelected?.product?.stock;
    if (typeof stock !== 'number' || typeof removed !== 'number') {
      return 0;
    }
    return stock - removed;
  };
  return [
    {
      width: '1fr ',
      subtitle: 'Producto',
      render: (subtitle) => (
        <Group>
          <span>{subtitle}</span>
        </Group>
      ),
    },
    {
      width: '0.8fr',
      subtitle: `Cantidad ${`(${currentQuantity()})`}`,
      render: (subtitle) => <span>{subtitle}</span>,
    },
    {
      width: ' 0.8fr ',
      subtitle: 'Motivo',
      render: (subtitle) => (
        <Group>
          <span>{subtitle}</span>
          <Button
            borderRadius={'normal'}
            title={<FontAwesomeIcon icon={faPlus} />}
          />
        </Group>
      ),
    },
    {
      width: '0.8fr',
      subtitle: 'Observaciones',
      render: (subtitle) => <span>{subtitle}</span>,
    },
    {
      width: 'min-content',
      subtitle: '',
      render: () => <div></div>,
    },
  ];
};
