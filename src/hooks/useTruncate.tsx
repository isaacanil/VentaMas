import { useState, useRef, useEffect, RefObject } from 'react';

interface UseTruncateResult {
  isTruncated: boolean;
  truncatedText: string;
  textRef: RefObject<HTMLSpanElement>;
  showTooltip: boolean;
}

const useTruncate = (
  text: string | null | undefined,
  containerRef: RefObject<HTMLElement>,
  useTooltip: boolean = true
): UseTruncateResult => {
  const [isTruncated, setIsTruncated] = useState(false);
  const [truncatedText, setTruncatedText] = useState<string>(text || '');
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!text) {
      setIsTruncated(false);
      setTruncatedText('');
      return;
    }

    const containerElement = containerRef.current;
    const element = textRef.current;
    if (!containerElement || !element) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    let frameId: number | null = null;

    const scheduleMeasurement = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        const style = window.getComputedStyle(containerElement);
        const containerWidth = containerElement.clientWidth;
        const fontShorthand = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        context.font = fontShorthand.trim();

        const textFits = context.measureText(text).width <= containerWidth;

        if (textFits) {
          setIsTruncated(false);
          setTruncatedText(text);
          return;
        }

        let left = 0;
        let right = text.length;
        let bestFit = '';

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const candidate = `${text.slice(0, mid)}...`;
          const candidateWidth = context.measureText(candidate).width;

          if (candidateWidth <= containerWidth) {
            bestFit = candidate;
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }

        setIsTruncated(true);
        setTruncatedText(bestFit);
      });
    };

    scheduleMeasurement();
    void document.fonts?.ready?.then(() => scheduleMeasurement()).catch(() => {
      /* swallow */
    });

    const resizeObserver = new ResizeObserver(scheduleMeasurement);
    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [text, containerRef, useTooltip]);

  return {
    isTruncated,
    truncatedText,
    textRef,
    showTooltip: isTruncated && useTooltip,
  };
};

export default useTruncate;
