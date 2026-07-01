import React, { useState, type ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { changeProductWeight } from '@/features/cart/cartSlice';
import {
  exceedsRestrictedWeightStock,
  formatWeightInputValue,
  resolveCommittedWeightValue,
  resolveMaxWeightForStock,
} from './WeightInput.helpers';

type WeightDetail = {
  weight?: number | string;
  weightUnit?: string;
};

type WeightItem = {
  cid?: string;
  restrictSaleWithoutStock?: boolean;
  stock?: number;
  weightDetail?: WeightDetail | null;
};

type WeightInputProps = {
  item: WeightItem;
};

type DraftWeightInputValue = {
  sourceWeightValue: WeightDetail['weight'];
  pinWhenBlurred: boolean;
  value: string;
};

export const WeightInput = ({ item }: WeightInputProps) => {
  const dispatch = useDispatch();
  const unit = item?.weightDetail?.weightUnit ?? 'unidad';
  const weightValue = item?.weightDetail?.weight;
  const formattedWeightValue = formatWeightInputValue(weightValue);
  const [draftValue, setDraftValue] = useState<DraftWeightInputValue>(() => ({
    sourceWeightValue: weightValue,
    pinWhenBlurred: false,
    value: formattedWeightValue,
  }));
  const [isFocused, setIsFocused] = useState(false);
  const maxWeight = resolveMaxWeightForStock({
      restrictSaleWithoutStock: item?.restrictSaleWithoutStock,
      stock: item?.stock,
      weightUnit: item?.weightDetail?.weightUnit,
    });
  const pinnedBlurredValue =
    draftValue.pinWhenBlurred &&
    Object.is(draftValue.sourceWeightValue, weightValue);
  const inputValue =
    isFocused || pinnedBlurredValue ? draftValue.value : formattedWeightValue;

  const commitWeight = (value: string) => {
    if (!item.cid) return;
    const nextWeight = resolveCommittedWeightValue({
      restrictSaleWithoutStock: item?.restrictSaleWithoutStock,
      stock: item?.stock,
      value,
      weightUnit: item?.weightDetail?.weightUnit,
    });

    dispatch(changeProductWeight({ id: item.cid, weight: nextWeight }));
    setDraftValue({
      sourceWeightValue: weightValue,
      pinWhenBlurred: true,
      value: formatWeightInputValue(nextWeight),
    });
  };

  const handleWeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setDraftValue({
      sourceWeightValue: weightValue,
      pinWhenBlurred: false,
      value: nextValue,
    });

    if (!item.cid) return;

    const weight = Number.parseFloat(nextValue.replace(',', '.'));
    if (!Number.isFinite(weight)) return;

    if (
      exceedsRestrictedWeightStock({
        restrictSaleWithoutStock: item?.restrictSaleWithoutStock,
        stock: item?.stock,
        weight,
        weightUnit: item?.weightDetail?.weightUnit,
      })
    ) {
      alert(
        `El peso solicitado no puede exceder el stock disponible (${maxWeight} ${unit}).`,
      );
      if (maxWeight !== null) {
        dispatch(changeProductWeight({ id: item.cid, weight: maxWeight }));
        setDraftValue({
          sourceWeightValue: weightValue,
          pinWhenBlurred: true,
          value: formatWeightInputValue(maxWeight),
        });
      }
    }
  };

  return (
    <WeightContainer>
      <Input
        aria-label={`Peso vendido (${unit})`}
        inputMode="decimal"
        max={maxWeight ?? undefined}
        min="0"
        pattern="[0-9]*[.,]?[0-9]*"
        step="0.001"
        type="text"
        value={inputValue}
        onBlur={(event) => {
          commitWeight(event.currentTarget.value);
          setIsFocused(false);
        }}
        onChange={handleWeightChange}
        onFocus={() => {
          setIsFocused(true);
          setDraftValue({
            sourceWeightValue: weightValue,
            pinWhenBlurred: false,
            value: formattedWeightValue,
          });
        }}
      />
      <UnitLabel>{unit}</UnitLabel>
    </WeightContainer>
  );
};

const WeightContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  overflow: hidden;
  background-color: #f5f5f7;
  border: 1px solid #ddd;
  border-radius: 10px;
`;

const Input = styled.input`
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  font-variant-numeric: tabular-nums;
  text-align: center;
  background-color: white;
  border: none;

  &:focus-visible {
    outline: 2px solid var(--primary-color, #1677ff);
    outline-offset: -2px;
  }
`;

const UnitLabel = styled.span`
  flex: 0 0 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  background-color: #f5f5f5;
  border-left: 1px solid #ddd;
`;

export default WeightInput;
