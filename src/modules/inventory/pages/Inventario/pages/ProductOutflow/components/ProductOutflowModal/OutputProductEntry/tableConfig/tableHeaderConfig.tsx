import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ComponentType, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { SelectProductSelected } from '@/features/productOutflow/productOutflow';
import { Button } from '@/components/ui/Button/Button';

type ProductSummary = {
  stock?: number;
};

type ProductOutflowSelected = {
  currentRemovedQuantity?: number;
  product?: ProductSummary | null;
};

export type TableHeaderColumn = {
  width: string;
  subtitle: string;
  render: (subtitle: string) => ReactNode;
};

type UseTableHeaderColumnsArgs = {
  Group: ComponentType<{ children: ReactNode }>;
};

export const useTableHeaderColumns = ({
  Group,
}: UseTableHeaderColumnsArgs): TableHeaderColumn[] => {
  const productSelected = useSelector(
    SelectProductSelected,
  ) as ProductOutflowSelected;
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
      render: (subtitle: string) => (
        <Group>
          <span>{subtitle}</span>
        </Group>
      ),
    },
    {
      width: '0.8fr',
      subtitle: `Cantidad ${`(${currentQuantity()})`}`,
      render: (subtitle: string) => <span>{subtitle}</span>,
    },
    {
      width: ' 0.8fr ',
      subtitle: 'Motivo',
      render: (subtitle: string) => (
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
      render: (subtitle: string) => <span>{subtitle}</span>,
    },
    {
      width: 'min-content',
      subtitle: '',
      render: (_subtitle: string) => <div />,
    },
  ];
};
