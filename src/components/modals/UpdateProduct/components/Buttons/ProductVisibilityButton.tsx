import { faCircleDot, faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from 'react-redux';

import { Button } from '@/components/ui/Button/Button';

interface VisibilityProductData {
  isVisible?: boolean;
  [key: string]: unknown;
}

interface ProductVisibilityButtonProps {
  product: VisibilityProductData;
  setProduct: (payload: VisibilityProductData) => {
    type: string;
    payload: VisibilityProductData;
  };
}

export const ProductVisibilityButton = ({
  product,
  setProduct,
}: ProductVisibilityButtonProps) => {
  const dispatch = useDispatch();
  const handleToggle = () => {
    dispatch(setProduct({ ...product, isVisible: !product.isVisible }));
  };
  return (
    <Button
      borderRadius={'normal'}
      alignText={'left'}
      title={product?.isVisible !== false ? 'Facturable' : 'No facturable'}
      isActivated={product?.isVisible !== false}
      iconOn={<FontAwesomeIcon icon={faCircleDot} />}
      iconOff={<FontAwesomeIcon icon={faCircle} />}
      onClick={handleToggle}
    />
  );
};
