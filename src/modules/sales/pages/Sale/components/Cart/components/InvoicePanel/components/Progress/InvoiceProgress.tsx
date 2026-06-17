import { useReducedMotion } from 'framer-motion';

import {
  ProgressContainer,
  ProgressContent,
  ProgressCurrent,
  ProgressDot,
  ProgressSpinner,
  ProgressStep,
  ProgressSteps,
} from './InvoiceProgress.styles';

const INVOICE_PROGRESS_STEPS = [
  {
    message: 'Validando venta',
    headline: 'Revisando que todo esté listo',
  },
  {
    message: 'Registrando venta',
    headline: 'Guardando la venta',
  },
  {
    message: 'Confirmando factura',
    headline: 'Confirmando la factura',
  },
  {
    message: 'Preparando comprobante/impresión',
    headline: 'Preparando el comprobante',
  },
] as const;

const progressEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

const contentTransition = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
  mass: 0.9,
} as const;

type InvoiceProgressProps = {
  message?: string;
  visible: boolean;
};

const resolveProgressMessage = (message?: string) => {
  const trimmed = typeof message === 'string' ? message.trim() : '';
  return trimmed || INVOICE_PROGRESS_STEPS[0].message;
};

export const InvoiceProgress = ({ message, visible }: InvoiceProgressProps) => {
  const reduceMotion = useReducedMotion();

  if (!visible) return null;

  const currentMessage = resolveProgressMessage(message);
  const matchedIndex = INVOICE_PROGRESS_STEPS.findIndex(
    (step) => step.message === currentMessage,
  );
  const activeIndex = matchedIndex >= 0 ? matchedIndex : 0;
  const currentHeadline =
    matchedIndex >= 0
      ? INVOICE_PROGRESS_STEPS[activeIndex].headline
      : currentMessage;

  return (
    <ProgressContainer>
      <ProgressContent
        initial={
          reduceMotion ? false : { opacity: 0, y: 12, filter: 'blur(8px)' }
        }
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={reduceMotion ? { duration: 0 } : contentTransition}
      >
        <ProgressCurrent
          key={currentHeadline}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.24, ease: progressEase }
          }
        >
          {currentHeadline}
        </ProgressCurrent>
        <ProgressSteps aria-label="Progreso de la venta">
          {INVOICE_PROGRESS_STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            const isComplete = index < activeIndex;

            return (
              <ProgressStep
                key={step.message}
                $active={isActive}
                $complete={isComplete}
                aria-current={isActive ? 'step' : undefined}
                aria-label={step.headline}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isActive && !reduceMotion ? 1.01 : 1,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.28,
                        delay: index * 0.04,
                        ease: progressEase,
                      }
                }
              >
                {isActive ? (
                  <ProgressSpinner size="sm" aria-hidden="true" />
                ) : (
                  <ProgressDot
                    $active={false}
                    $complete={isComplete}
                    aria-hidden="true"
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.2, ease: progressEase }}
                  />
                )}
                <span>{step.headline}</span>
              </ProgressStep>
            );
          })}
        </ProgressSteps>
      </ProgressContent>
    </ProgressContainer>
  );
};
