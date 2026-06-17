import { useReducer, useRef, useEffect, type RefObject } from 'react';

interface UseTruncateResult {
  isTruncated: boolean;
  truncatedText: string;
  textRef: RefObject<HTMLSpanElement>;
  showTooltip: boolean;
}

const useTruncate = (
  text: string | null | undefined,
  containerRef: RefObject<HTMLElement>,
  useTooltip = true,
): UseTruncateResult => {
  const [truncateState, dispatch] = useReducer(
    (
      state: { isTruncated: boolean; truncatedText: string },
      action:
        | { type: 'reset' }
        | {
            type: 'measure';
            payload: { isTruncated: boolean; truncatedText: string };
          },
    ) => {
      switch (action.type) {
        case 'reset':
          return {
            isTruncated: false,
            truncatedText: '',
          };
        case 'measure':
          return action.payload;
        default:
          return state;
      }
    },
    {
      isTruncated: false,
      truncatedText: text || '',
    },
  );
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!text) {
      requestAnimationFrame(() => {
        dispatch({ type: 'reset' });
      });
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
        const fontShorthand =
          style.font ||
          `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        context.font = fontShorthand.trim();

        const textFits = context.measureText(text).width <= containerWidth;

        if (textFits) {
          dispatch({
            type: 'measure',
            payload: {
              isTruncated: false,
              truncatedText: text,
            },
          });
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

        dispatch({
          type: 'measure',
          payload: {
            isTruncated: true,
            truncatedText: bestFit,
          },
        });
      });
    };

    scheduleMeasurement();
    void document.fonts?.ready
      ?.then(() => scheduleMeasurement())
      .catch(() => {
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
    isTruncated: truncateState.isTruncated,
    truncatedText: truncateState.truncatedText,
    textRef,
    showTooltip: truncateState.isTruncated && useTooltip,
  };
};

export default useTruncate;
