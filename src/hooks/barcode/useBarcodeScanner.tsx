import { useEffect, useRef } from 'react';

type BarcodeScannerOptions = {
  enabled?: boolean;
  endKeys?: ReadonlyArray<string>;
  minLength?: number;
  maxInterKeyDelayMs?: number;
  flushTimeoutMs?: number;
};

export type BarcodeScanTermination = string | 'timeout';

export interface BarcodeScanMeta {
  fromEditable: boolean;
  charCount: number;
  terminatedBy: BarcodeScanTermination;
}

const DEFAULT_END_KEYS = ['Enter', 'NumpadEnter', 'Tab'] as const;
const DEFAULT_MIN_LENGTH = 4;
const DEFAULT_MAX_INTER_KEY_DELAY_MS = 110;
const DEFAULT_FLUSH_TIMEOUT_MS = 90;

const isEditableElement = (target: HTMLElement | null): boolean => {
  if (!target) return false;

  if (target.isContentEditable) return true;

  const tagName = target.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
};

const isPrintableKey = (key: string): boolean => key.length === 1;

const removeControlChars = (value: string): string => {
  let output = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if ((code >= 32 && code !== 127) || code === 9 || code === 10 || code === 13) {
      output += char;
    }
  }
  return output;
};

const sanitizeScannedValue = (value: string): string =>
  removeControlChars(value).replace(/\s+/g, '').trim();

export const useBarcodeScanner = (
  onBarcode: (barcode: string, meta?: BarcodeScanMeta) => void,
  options: BarcodeScannerOptions = {},
) => {
  const {
    enabled = true,
    endKeys = DEFAULT_END_KEYS,
    minLength = DEFAULT_MIN_LENGTH,
    maxInterKeyDelayMs = DEFAULT_MAX_INTER_KEY_DELAY_MS,
    flushTimeoutMs = DEFAULT_FLUSH_TIMEOUT_MS,
  } = options;

  const endKeysRef = useRef<Set<string>>(new Set(endKeys));
  const onBarcodeRef = useRef(onBarcode);
  const barcodeRef = useRef('');
  const lastKeyAtRef = useRef<number | null>(null);
  const maxObservedGapRef = useRef(0);
  const fromEditableRef = useRef(false);
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onBarcodeRef.current = onBarcode;
  }, [onBarcode]);

  useEffect(() => {
    endKeysRef.current = new Set(endKeys);
  }, [endKeys]);

  useEffect(() => {
    if (!enabled) {
      if (flushTimerRef.current != null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      barcodeRef.current = '';
      lastKeyAtRef.current = null;
      maxObservedGapRef.current = 0;
      fromEditableRef.current = false;
      return;
    }

    const resetBuffer = () => {
      barcodeRef.current = '';
      lastKeyAtRef.current = null;
      maxObservedGapRef.current = 0;
      fromEditableRef.current = false;
    };

    const clearFlushTimer = () => {
      if (flushTimerRef.current == null) return;
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    };

    const emitIfValid = (terminatedBy: BarcodeScanTermination) => {
      const scanned = sanitizeScannedValue(barcodeRef.current);
      const isLongEnough = scanned.length >= minLength;
      const cadenceIsScannerLike =
        maxObservedGapRef.current <= maxInterKeyDelayMs ||
        scanned.length >= 12;

      if (!isLongEnough) {
        resetBuffer();
        return;
      }

      if (fromEditableRef.current && !cadenceIsScannerLike) {
        resetBuffer();
        return;
      }

      onBarcodeRef.current(scanned, {
        fromEditable: fromEditableRef.current,
        charCount: scanned.length,
        terminatedBy,
      });
      resetBuffer();
    };

    const scheduleFlush = () => {
      clearFlushTimer();
      flushTimerRef.current = window.setTimeout(() => {
        emitIfValid('timeout');
      }, flushTimeoutMs);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget = isEditableElement(target);

      if (event.isComposing) return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const now = performance.now();
      const key = event.key;

      if (endKeysRef.current.has(key)) {
        clearFlushTimer();
        emitIfValid(key);
        return;
      }

      if (!isPrintableKey(key)) return;

      const lastKeyAt = lastKeyAtRef.current;
      if (
        lastKeyAt != null &&
        now - lastKeyAt > Math.max(maxInterKeyDelayMs * 2, 400)
      ) {
        resetBuffer();
      }

      if (!barcodeRef.current) {
        fromEditableRef.current = isEditableTarget;
      }

      if (lastKeyAt != null) {
        maxObservedGapRef.current = Math.max(
          maxObservedGapRef.current,
          now - lastKeyAt,
        );
      }

      barcodeRef.current += key;
      lastKeyAtRef.current = now;
      scheduleFlush();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearFlushTimer();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, flushTimeoutMs, maxInterKeyDelayMs, minLength]);
};
