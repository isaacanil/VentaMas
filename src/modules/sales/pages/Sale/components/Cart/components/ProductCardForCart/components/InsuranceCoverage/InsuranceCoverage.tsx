import { motion } from 'framer-motion';
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { updateProductInsurance } from '@/features/cart/cartSlice';

type InsuranceMode = 'porcentaje' | 'monto';

type InsuranceState = {
  mode: InsuranceMode;
  rawValue: string;
};

type InsuranceInfo = {
  mode?: InsuranceMode | string;
  value?: number | string | null;
};

type InsuranceItem = {
  id?: string | number;
  cid?: string | number;
  insurance?: InsuranceInfo | null;
  pricing?: { price?: number | string };
  price?: number | string;
};

type InsuranceCoverageProps = {
  item: InsuranceItem;
};

const INSURANCE_MODES = {
  PERCENTAGE: 'porcentaje',
  AMOUNT: 'monto',
} as const;

const sanitizeNumericInput = (
  value: string | number | null | undefined = '',
): string | null => {
  if (value === '' || value === null || value === undefined) return '';

  const normalized = String(value).replace(',', '.');

  if (normalized === '.') return '0.';

  const isValid = /^(\d+)?(\.\d*)?$/.test(normalized);
  if (!isValid) return null;

  return normalized.startsWith('.') ? `0${normalized}` : normalized;
};

const deriveInitialState = (product: InsuranceItem): InsuranceState => {
  const storedMode = product?.insurance?.mode;
  const mode =
    storedMode === INSURANCE_MODES.AMOUNT ||
    storedMode === INSURANCE_MODES.PERCENTAGE
      ? storedMode
      : INSURANCE_MODES.PERCENTAGE;
  const storedValue = product?.insurance?.value;

  if (storedValue === undefined || storedValue === null || storedValue === '') {
    return { mode, rawValue: '' };
  }

  const normalized = sanitizeNumericInput(String(storedValue));
  return {
    mode,
    rawValue: normalized ?? String(storedValue),
  };
};

const clampByMode = (
  value: string,
  mode: InsuranceMode,
  productPrice: number,
): number | null => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;

  if (mode === INSURANCE_MODES.PERCENTAGE) {
    return Math.max(0, Math.min(100, numeric));
  }

  if (productPrice > 0) {
    return Math.max(0, Math.min(productPrice, numeric));
  }

  return Math.max(0, numeric);
};

const formatNumberForDisplay = (value: number | string): string => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return `${numeric}`;
};

export const InsuranceCoverage = ({ item }: InsuranceCoverageProps) => {
  const dispatch = useDispatch();
  const productId = item?.id ?? item?.cid;

  const derivedState = useMemo(() => deriveInitialState(item), [item]);
  const derivedKey = useMemo(
    () => `${derivedState.mode}|${derivedState.rawValue}`,
    [derivedState.mode, derivedState.rawValue],
  );

  const [{ trigger: localTrigger, value: localValue }, setLocalState] =
    useState(() => {
      const initial = deriveInitialState(item);
      return {
        trigger: `${initial.mode}|${initial.rawValue}`,
        value: initial,
      };
    });

  const insuranceState = localTrigger === derivedKey ? localValue : derivedState;

  const updateInsuranceState = useCallback(
    (updater: InsuranceState | ((prev: InsuranceState) => InsuranceState)) => {
      setLocalState((prev) => {
        const base = prev.trigger === derivedKey ? prev.value : derivedState;
        const nextValue =
          typeof updater === 'function' ? updater(base) : updater;
        return { trigger: derivedKey, value: nextValue };
      });
    },
    [derivedKey, derivedState],
  );

  const productPrice = useMemo(() => {
    const pricingPrice = Number(item?.pricing?.price);
    if (Number.isFinite(pricingPrice)) return pricingPrice;
    const fallbackPrice = Number(item?.price);
    return Number.isFinite(fallbackPrice) ? fallbackPrice : 0;
  }, [item?.price, item?.pricing?.price]);

  const dispatchInsurance = useCallback(
    (mode: InsuranceMode, rawValue: string | null | undefined) => {
      if (!productId) return;

      dispatch(
        updateProductInsurance({
          id: productId,
          mode,
          value:
            rawValue === null || rawValue === undefined ? '' : String(rawValue),
        }),
      );
    },
    [dispatch, productId],
  );

  const commitValue = useCallback(
    (mode: InsuranceMode, rawValue: string) => {
      if (!productId) return;

      if (rawValue === '') {
        dispatchInsurance(mode, '');
        return;
      }

      const clampedValue = clampByMode(rawValue, mode, productPrice);

      if (clampedValue === null) {
        updateInsuranceState((prev) => ({ ...prev, rawValue: '' }));
        dispatchInsurance(mode, '');
        return;
      }

      const formattedValue = formatNumberForDisplay(clampedValue);
      updateInsuranceState((prev) => ({
        ...prev,
        rawValue: formattedValue,
      }));
      dispatchInsurance(mode, formattedValue);
    },
    [dispatchInsurance, productId, productPrice, updateInsuranceState],
  );

  const handleModeChange = useCallback(
    (nextMode: InsuranceMode) => {
      if (nextMode === insuranceState.mode) return;
      updateInsuranceState((prev) => ({ ...prev, mode: nextMode }));
      commitValue(nextMode, insuranceState.rawValue);
    },
    [commitValue, insuranceState.mode, insuranceState.rawValue, updateInsuranceState],
  );

  const handleToggleClick = useCallback(() => {
    const nextMode =
      insuranceState.mode === INSURANCE_MODES.PERCENTAGE
        ? INSURANCE_MODES.AMOUNT
        : INSURANCE_MODES.PERCENTAGE;

    handleModeChange(nextMode);
  }, [handleModeChange, insuranceState.mode]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = sanitizeNumericInput(event.target.value);
      if (sanitizedValue === null) return;

      updateInsuranceState((prev) => ({ ...prev, rawValue: sanitizedValue }));
      dispatchInsurance(insuranceState.mode, sanitizedValue);
    },
    [dispatchInsurance, insuranceState.mode, updateInsuranceState],
  );

  const handleInputBlur = useCallback(() => {
    commitValue(insuranceState.mode, insuranceState.rawValue);
  }, [commitValue, insuranceState.mode, insuranceState.rawValue]);

  const isAmountMode = insuranceState.mode === INSURANCE_MODES.AMOUNT;

  const placeholder = isAmountMode
    ? productPrice > 0
      ? `0 - ${productPrice}`
      : 'Monto'
    : '0 - 100';

  return (
    <CoveragePill
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      role="group"
      aria-label="Cobertura de seguro"
    >
      <CoverageLabel>Cobertura</CoverageLabel>
      <CoverageControls>
        <ToggleSwitch>
          <ToggleTrackButton
            type="button"
            onClick={handleToggleClick}
            aria-label={
              isAmountMode
                ? 'Cambiar a cobertura por porcentaje'
                : 'Cambiar a cobertura por monto'
            }
            aria-pressed={isAmountMode}
          >
            <SwitchOption $position="left" $active={!isAmountMode}>
              %
            </SwitchOption>
            <SwitchOption $position="right" $active={isAmountMode}>
              $
            </SwitchOption>
            <ToggleThumb
              animate={{ x: isAmountMode ? 24 : -2 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            />
          </ToggleTrackButton>
        </ToggleSwitch>
        <ValueInput
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          value={insuranceState.rawValue}
          placeholder={placeholder}
          aria-label={
            isAmountMode
              ? 'Valor de cobertura en monto'
              : 'Valor de cobertura en porcentaje'
          }
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          whileFocus={{ boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.25)' }}
        />
      </CoverageControls>
    </CoveragePill>
  );
};

const CoveragePill = styled(motion.div)`
  display: inline-flex;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 6px rgb(15 23 42 / 6%);
  }
`;

const CoverageLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const CoverageControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
`;

const ToggleSwitch = styled.div`
  display: flex;
  justify-content: center;
`;

const ToggleTrackButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  width: 52px;
  height: 28px;
  padding: 0 2px;
  cursor: pointer;
  background-color: #f3f4f6;
  border: 1px solid #e0e7ff;
  border-radius: 999px;
  box-shadow: inset 0 1px 4px rgb(15 23 42 / 6%);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: #c7d2fe;
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
`;

const ToggleThumb = styled(motion.div)`
  position: absolute;
  left: 2px;
  z-index: 1;
  width: 24px;
  height: 24px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgb(15 23 42 / 10%);
`;

const SwitchOption = styled.span`
  position: absolute;
  left: ${({ $position }) => ($position === 'left' ? '10px' : '32px')};
  z-index: 2;
  font-size: 13px;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#111827' : '#6b7280')};
  text-transform: uppercase;
  pointer-events: none;
  transition: color 0.2s ease;
`;

const ValueInput = styled(motion.input)`
  flex: 1;
  width: 100%;
  min-width: 76px;
  height: 32px;
  padding: 0 10px;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #111827;
  text-align: center;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus {
    border-color: #2563eb;
  }

  &:focus {
    outline: none;
  }

  &::placeholder {
    font-weight: 500;
    color: #9ca3af;
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    margin: 0;
    appearance: none;
  }
`;

export default InsuranceCoverage;
