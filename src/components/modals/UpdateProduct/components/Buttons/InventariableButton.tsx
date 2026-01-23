import { faCircleDot, faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from 'react-redux';

import { Button } from '@/components/ui/Button/Button';

interface InventoryProductData {
  trackInventory?: boolean;
  [key: string]: unknown;
}

interface InventariableButtonProps {
  product: InventoryProductData;
  setProduct: (payload: InventoryProductData) => { type: string; payload: InventoryProductData };
}

export const InventariableButton = ({
  product,
  setProduct,
}: InventariableButtonProps) => {
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(
      setProduct({ ...product, trackInventory: !product?.trackInventory }),
    );
  };

  return (
    <Button
      borderRadius={'normal'}
      alignText={'left'}
      title={'Invetariable'}
      isActivated={product?.trackInventory}
      iconOn={<FontAwesomeIcon icon={faCircleDot} />}
      iconOff={<FontAwesomeIcon icon={faCircle} />}
      onClick={handleToggle}
    />
  );
};
