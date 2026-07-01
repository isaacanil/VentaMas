import { Fragment, useState, type ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';

import {
  addAmountToProduct,
  diminishAmountToProduct,
  onChangeValueAmountToProduct,
} from '@/features/cart/cartSlice';

import {
  exceedsRestrictedStock,
  normalizeCounterAmount,
  parseCounterInputValue,
  resolveMaxCounterAmountForStock,
} from './CartQuantityCounter.helpers';
import {
  ButtonCounter,
  Container,
  CounterDisplay,
  CounterIcon,
} from './CartQuantityCounter.styles';
import { DeleteProductAlert } from './components/DeleteProductAlert/DeleteProductAlert';

export type CartQuantityCounterItem = {
  restrictSaleWithoutStock?: boolean;
  saleUnitConversionFactor?: number;
  allowFractional?: boolean;
};

export type CartQuantityCounterProps = {
  amountToBuy: number;
  stock?: number;
  id: string;
  item: CartQuantityCounterItem;
};

export const CartQuantityCounter = ({
  amountToBuy,
  stock,
  id,
  item,
}: CartQuantityCounterProps) => {
  const dispatch = useDispatch();
  const [showDeletePreventAlert, setShowDeletePreventAlert] = useState(false);
  const inputAmount = normalizeCounterAmount(amountToBuy);

  const restrictSaleWithoutStock = item.restrictSaleWithoutStock;
  const saleUnitConversionFactor = item.saleUnitConversionFactor;
  const allowFractional = item.allowFractional === true;
  const maxCounterAmount = resolveMaxCounterAmountForStock({
    stock,
    saleUnitConversionFactor,
    allowFractional,
  });
  const stockLabel =
    saleUnitConversionFactor && saleUnitConversionFactor > 1
      ? `${stock} unidades base`
      : `${stock} unidades`;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseCounterInputValue(event.target.value, allowFractional);
    if (value === null) return;

    if (
      exceedsRestrictedStock({
        value,
        stock,
        restrictSaleWithoutStock,
        saleUnitConversionFactor,
      })
    ) {
      alert(
        `La cantidad solicitada no puede exceder el stock disponible (${stockLabel}).`,
      );
      if (maxCounterAmount && maxCounterAmount > 0) {
        dispatch(onChangeValueAmountToProduct({ id, value: maxCounterAmount }));
      }
      return;
    }

    if (value > 0) {
      dispatch(onChangeValueAmountToProduct({ id, value }));
    }
  };

  const handleIncreaseCounter = () => {
    const newValue = inputAmount + 1;

    if (
      exceedsRestrictedStock({
        value: newValue,
        stock,
        restrictSaleWithoutStock,
        saleUnitConversionFactor,
      })
    ) {
      alert(`No puedes agregar más de ${stockLabel}.`);
      return;
    }

    dispatch(addAmountToProduct({ id }));
  };

  const handleDiminishCounter = () => {
    if (inputAmount > 1) {
      dispatch(diminishAmountToProduct({ id }));
      return;
    }

    setShowDeletePreventAlert(true);
  };

  return (
    <Fragment>
      <Container>
        <ButtonCounter
          onClick={handleDiminishCounter}
          aria-label="Disminuir cantidad"
        >
          <CounterIcon>−</CounterIcon>
        </ButtonCounter>
        <CounterDisplay
          type="text"
          inputMode={allowFractional ? 'decimal' : 'numeric'}
          pattern={allowFractional ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
          value={inputAmount}
          onChange={handleInputChange}
          aria-label="Cantidad"
        />
        <ButtonCounter
          onClick={handleIncreaseCounter}
          disabled={exceedsRestrictedStock({
            value: inputAmount + 1,
            stock,
            restrictSaleWithoutStock,
            saleUnitConversionFactor,
          })}
          aria-label="Aumentar cantidad"
        >
          <CounterIcon>+</CounterIcon>
        </ButtonCounter>
      </Container>
      <DeleteProductAlert
        id={id}
        isOpen={showDeletePreventAlert}
        handleIsOpen={setShowDeletePreventAlert}
      />
    </Fragment>
  );
};
