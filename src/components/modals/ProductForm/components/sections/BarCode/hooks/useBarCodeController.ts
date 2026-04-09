import { message, type InputRef } from 'antd';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { ChangeProductData } from '@/features/updateProduct/updateProductSlice';
import useBarcodeSettings from '@/hooks/barcode/useBarcodeSettings';
import {
  getBarcodeInfo,
  PRINT_DPI,
  getGS1Geometry,
} from '@/utils/barcode/barcode';
import type { ProductRecord } from '@/types/products';

type BarcodeFixSuggestion = {
  fixed: string;
  reason?: string;
  type?: string;
};

type BarcodeValidationInfo = {
  isValid: boolean;
  expected: string | number;
  message: string;
};

type BarcodeRenderProps = {
  width: number;
  height: number;
  fontSize: number;
  margin: number;
  quietZone: number;
  background: string;
};

const getGs1GeometryForType = (barcodeType?: string | null) =>
  getGS1Geometry(PRINT_DPI, barcodeType ?? undefined);

export const useBarCodeController = (product: ProductRecord) => {
  const SCANNER_SUFFIX_GAP_MS = 130;
  const [showGenerator, setShowGenerator] = useState(false);
  const [inputHasFocus, setInputHasFocus] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isFixTooltipDismissed, setIsFixTooltipDismissed] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState(String(product?.barcode || ''));
  const barcodeInputRef = useRef<InputRef | null>(null);
  const lastBarcodeKeyAtRef = useRef<number | null>(null);
  const restoreFocusOnBlurRef = useRef(false);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isConfigured } = useBarcodeSettings();
  const productBarcode = String(product?.barcode || '');
  const effectiveBarcodeValue = inputHasFocus ? barcodeValue : productBarcode;
  const barcodeInfo = (
    effectiveBarcodeValue ? getBarcodeInfo(effectiveBarcodeValue) : null
  ) as ReturnType<typeof getBarcodeInfo> | null;
  const dispatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBarcodeRef = useRef<string | null>(null);

  const barcodeRenderProps = useMemo<BarcodeRenderProps>(() => {
    const geometry = getGs1GeometryForType(barcodeInfo?.type);

    return {
      width: (geometry.xPx / PRINT_DPI) * 96,
      height: Math.max((geometry.heightPx / PRINT_DPI) * 96, 35),
      fontSize: 10,
      margin: 0,
      quietZone: geometry.quietZoneMm,
      background: 'white',
    };
  }, [barcodeInfo?.type]);

  const validationInfo = useMemo<BarcodeValidationInfo | null>(() => {
    if (!effectiveBarcodeValue || !barcodeInfo?.type) return null;

    const geometry = getGs1GeometryForType(barcodeInfo.type);
    const length = effectiveBarcodeValue.length;

    if (geometry.exactLength) {
      const ok = length === geometry.exactLength;
      return {
        isValid: ok,
        expected: geometry.exactLength,
        message: ok
          ? `Longitud correcta (${length} dígitos)`
          : `Requiere exactamente ${geometry.exactLength} dígitos (actual: ${length})`,
      };
    }

    if (geometry.maxLength) {
      const ok = length <= geometry.maxLength;
      return {
        isValid: ok,
        expected: `<=${geometry.maxLength}`,
        message: ok
          ? `Longitud válida (${length}/${geometry.maxLength} dígitos)`
          : `Excede máximo ${geometry.maxLength} dígitos (actual: ${length})`,
      };
    }

    return null;
  }, [barcodeInfo, effectiveBarcodeValue]);

  const overallValidation = useMemo(() => {
    const lengthValid = validationInfo?.isValid ?? true;

    if (!lengthValid) {
      return { status: 'error' as const, message: validationInfo?.message };
    }

    return { status: 'success' as const, message: null };
  }, [validationInfo]);

  const handleGeneratedCode = useCallback(
    (code: string) => {
      setBarcodeValue(code);
      dispatch(
        ChangeProductData({
          product: { barcode: code },
        }),
      );
      setIsFixTooltipDismissed(false);
    },
    [dispatch],
  );

  const handleCorrectedCode = useCallback(
    (code: string) => {
      setBarcodeValue(code);
      dispatch(ChangeProductData({ product: { barcode: code } }));
      setIsFixTooltipDismissed(true);
      message.success('Código corregido aplicado');
    },
    [dispatch],
  );

  useEffect(() => {
    return () => {
      if (dispatchTimeoutRef.current) {
        clearTimeout(dispatchTimeoutRef.current);
      }
    };
  }, []);

  const flushPendingBarcode = useCallback(() => {
    if (dispatchTimeoutRef.current) {
      clearTimeout(dispatchTimeoutRef.current);
      dispatchTimeoutRef.current = null;
    }
    if (pendingBarcodeRef.current !== null) {
      dispatch(
        ChangeProductData({ product: { barcode: pendingBarcodeRef.current } }),
      );
      pendingBarcodeRef.current = null;
    }
  }, [dispatch]);

  const handleBarcodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setBarcodeValue(value);
      setIsFixTooltipDismissed(false);

      pendingBarcodeRef.current = value;
      if (dispatchTimeoutRef.current) {
        clearTimeout(dispatchTimeoutRef.current);
      }
      dispatchTimeoutRef.current = setTimeout(() => {
        pendingBarcodeRef.current = null;
        dispatch(ChangeProductData({ product: { barcode: value } }));
      }, 300);
    },
    [dispatch],
  );

  const handleBarcodeInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      const now = performance.now();
      const key = event.key;
      const isEnterKey = key === 'Enter' || key === 'NumpadEnter';
      const isTabKey = key === 'Tab';

      if (isEnterKey) {
        restoreFocusOnBlurRef.current = true;
        event.preventDefault();
        event.stopPropagation();
      } else if (isTabKey) {
        const lastKeyAt = lastBarcodeKeyAtRef.current;
        const tabLooksLikeScannerSuffix =
          lastKeyAt != null && now - lastKeyAt <= SCANNER_SUFFIX_GAP_MS;

        if (tabLooksLikeScannerSuffix) {
          restoreFocusOnBlurRef.current = true;
          event.preventDefault();
          event.stopPropagation();
        }
      }

      if (key.length === 1) {
        lastBarcodeKeyAtRef.current = now;
      }
    },
    [],
  );

  const handleBarcodeInputBlur = useCallback(() => {
    setInputHasFocus(false);
    flushPendingBarcode();

    if (!restoreFocusOnBlurRef.current) return;
    restoreFocusOnBlurRef.current = false;

    window.requestAnimationFrame(() => {
      barcodeInputRef.current?.focus({ cursor: 'end' });
      setInputHasFocus(true);
    });
  }, [flushPendingBarcode]);

  const validationIcon = useMemo(() => {
    if (!effectiveBarcodeValue) return null;

    return barcodeInfo?.valid ? 'valid' : 'invalid';
  }, [barcodeInfo?.valid, effectiveBarcodeValue]);

  const inputSuffix = validationIcon ?? 'empty';

  const barcodeStyle = useMemo(() => {
    if (!effectiveBarcodeValue) return { $valid: true };
    return { $valid: barcodeInfo?.valid || false };
  }, [barcodeInfo?.valid, effectiveBarcodeValue]);

  const correction = useMemo<BarcodeFixSuggestion | null>(() => {
    if (!effectiveBarcodeValue || barcodeInfo?.valid) return null;

    const getExpectedLengthByType = (length: number) => {
      switch (length) {
        case 7:
          return { type: 'EAN-8', expectedLength: 8 };
        case 12:
          return { type: 'EAN-13', expectedLength: 13 };
        case 11:
          return { type: 'UPC-A', expectedLength: 12 };
        case 17:
          return { type: 'ITF-14', expectedLength: 18 };
        default:
          return null;
      }
    };

    const currentLength = effectiveBarcodeValue.length;
    const expectedType = getExpectedLengthByType(currentLength);

    if (expectedType && currentLength === expectedType.expectedLength - 1) {
      const calculateCheckDigit = (code: string, type: string) => {
        if (type === 'EAN-8' || type === 'EAN-13' || type === 'UPC-A') {
          let sum = 0;
          for (let index = 0; index < code.length; index += 1) {
            const digit = parseInt(code[index], 10);
            sum += index % 2 === 0 ? digit : digit * 3;
          }
          return (10 - (sum % 10)) % 10;
        }

        if (type === 'ITF-14') {
          let sum = 0;
          for (let index = 0; index < code.length; index += 1) {
            const digit = parseInt(code[index], 10);
            sum += index % 2 === 0 ? digit * 3 : digit;
          }
          return (10 - (sum % 10)) % 10;
        }

        return 0;
      };

      const checkDigit = calculateCheckDigit(
        effectiveBarcodeValue,
        expectedType.type,
      );
      const completeCode = effectiveBarcodeValue + checkDigit;

      return {
        fixed: completeCode,
        reason: `Completar ${expectedType.type} con dígito verificador: ${checkDigit}`,
        type: 'complete',
      };
    }

    if (
      barcodeInfo?.checkDigit &&
      !barcodeInfo.checkDigit.isValid &&
      barcodeInfo.checkDigit.correctDigit !== undefined
    ) {
      return {
        fixed:
          effectiveBarcodeValue.slice(0, -1) +
          String(barcodeInfo.checkDigit.correctDigit),
        reason: `Dígito verificador incorrecto: ${effectiveBarcodeValue.slice(-1)} → ${barcodeInfo.checkDigit.correctDigit}`,
        type: 'checkdigit',
      };
    }

    return null;
  }, [barcodeInfo, effectiveBarcodeValue]);

  const showFixTooltip =
    inputHasFocus && Boolean(correction) && !isFixTooltipDismissed;

  return {
    barcodeInfo,
    barcodeInputRef,
    barcodeRenderProps,
    barcodeStyle,
    correction,
    effectiveBarcodeValue,
    handleBarcodeChange,
    handleBarcodeInputBlur,
    handleBarcodeInputKeyDown,
    handleCorrectedCode,
    handleGeneratedCode,
    inputHasFocus,
    inputSuffix,
    isConfigured,
    overallValidation,
    productBarcode,
    setBarcodeValue,
    setInputHasFocus,
    setIsFixTooltipDismissed,
    setShowGenerator,
    setShowInfoModal,
    setShowPreviewModal,
    setShowPrintModal,
    showFixTooltip,
    showGenerator,
    showInfoModal,
    showPreviewModal,
    showPrintModal,
    user,
    validationIcon,
    validationInfo,
  };
};
