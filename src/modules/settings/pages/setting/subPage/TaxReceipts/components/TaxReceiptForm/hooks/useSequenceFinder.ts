import { message, type FormInstance } from 'antd';
import { useState } from 'react';

import type { TaxReceiptSequenceValidation } from '@/types/taxReceipt';

import {
  buildPrefix,
  normalizeDigits,
  resolveIncrement,
  toDigits,
} from '../utils/ncfUtils';
import { MAX_SEQUENCE_LOOKAHEAD } from '../utils/sequenceConflicts';

interface SequenceFormValues {
  type?: string;
  serie?: string;
  sequence?: number | string;
  sequenceLength?: number | string;
  increase?: number | string;
  quantity?: number | string;
}

interface SequenceInsightEntry {
  number: number;
  step?: number;
  ncf?: string;
  invoices?: unknown[];
  normalizedDigits?: string;
}

interface SequenceInsights {
  lastUsed?: SequenceInsightEntry;
  availableBefore?: SequenceInsightEntry[];
  availableAfter?: SequenceInsightEntry[];
}

type SequenceValidationResult = TaxReceiptSequenceValidation & {
  insights?: SequenceInsights;
};

type SequenceConflictChecker = (
  values: SequenceFormValues,
) => Promise<SequenceValidationResult>;

interface UseSequenceFinderArgs {
  form?: FormInstance<SequenceFormValues>;
  resolveSequenceLength?: (length: number, sequenceLength?: number) => number;
  checkSequenceConflicts?: SequenceConflictChecker;
}

type CandidateSource =
  | 'before'
  | 'after'
  | 'current'
  | 'fallback-before'
  | 'fallback-after'
  | 'last-used';

interface CandidateMeta {
  source: CandidateSource;
  step?: number;
  allowCurrentConflict?: boolean;
}

interface CandidateAttempt {
  number: number;
  meta?: CandidateMeta;
  validation?: SequenceValidationResult | null;
}

const resolveFiniteNumber = (value: unknown): number | null => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const resolveSequenceLengthInput = (value: unknown): number | undefined => {
  const numeric = resolveFiniteNumber(value);
  return numeric === null ? undefined : numeric;
};

export const useSequenceFinder = ({
  form,
  resolveSequenceLength,
  checkSequenceConflicts,
}: UseSequenceFinderArgs = {}) => {
  const [findingNextSequence, setFindingNextSequence] = useState(false);

  const handleFindNextAvailableSequence = async () => {
    if (findingNextSequence) return;
    if (!form) return;

    const currentValues = form.getFieldsValue();
    const prefix = String(
      buildPrefix(currentValues.type, currentValues.serie) ?? '',
    );

    if (!prefix) {
      message.warning(
        'Completa la serie y el tipo antes de buscar disponibilidad.',
      );
      return;
    }

    const digits = String(toDigits(currentValues.sequence ?? '') ?? '');
    if (!digits) {
      message.warning(
        'Ingresa una secuencia numérica para buscar disponibilidad.',
      );
      return;
    }

    const normalizedDigits = String(normalizeDigits(digits) ?? '');
    const baseNumber = Number(normalizedDigits);

    if (!Number.isFinite(baseNumber)) {
      message.error('Secuencia inválida para sugerir disponibilidad.');
      return;
    }

    const incrementCandidate = resolveFiniteNumber(
      resolveIncrement(currentValues.increase),
    );
    const increment =
      incrementCandidate && incrementCandidate > 0 ? incrementCandidate : 1;
    setFindingNextSequence(true);

    const resolver = (length: number, sequenceLength?: number) =>
      typeof resolveSequenceLength === 'function'
        ? resolveSequenceLength(length, sequenceLength)
        : length;

    try {
      let initialValidation: SequenceValidationResult | null = null;
      try {
        if (checkSequenceConflicts) {
          initialValidation = await checkSequenceConflicts(currentValues);
        }
      } catch (validationError) {
        console.error(
          'Error validando la secuencia actual antes de sugerir disponibilidad:',
          validationError,
        );
        message.error(
          'No se pudo analizar la secuencia actual. Inténtalo nuevamente.',
        );
        return;
      }

      const testedNumbers = new Set<number>();
      const insights: SequenceInsights = initialValidation?.insights ?? {};
      const lastUsedInfo = insights.lastUsed;

      const attemptCandidate = async ({
        number,
        meta,
        validation,
      }: CandidateAttempt) => {
        if (!Number.isFinite(number)) return false;
        const roundedNumber = Math.max(Math.floor(number), 0);
        if (testedNumbers.has(roundedNumber)) return false;
        testedNumbers.add(roundedNumber);

        const candidateDigits = roundedNumber.toString();
        const candidateValues = { ...currentValues, sequence: candidateDigits };

        let validationResult = validation ?? null;
        if (!validationResult) {
          try {
            if (checkSequenceConflicts) {
              validationResult = await checkSequenceConflicts(candidateValues);
            }
          } catch (candidateError) {
            console.error(
              'Error validando secuencia candidata:',
              candidateError,
            );
            return false;
          }
        }

        const allowCurrentConflict =
          meta?.allowCurrentConflict &&
          validationResult?.reason === 'current-sequence-used' &&
          !validationResult?.hasImmediateNextConflict;

        if (!validationResult?.ok && !allowCurrentConflict) {
          return false;
        }

        const normalizedCurrent = normalizeDigits(candidateDigits);
        const resolvedLengthRaw = resolver(
          Math.max(
            normalizedCurrent.length,
            validationResult?.nextDigitsLength ?? normalizedCurrent.length,
          ),
          resolveSequenceLengthInput(candidateValues.sequenceLength),
        );
        const resolvedLength = Number.isFinite(resolvedLengthRaw)
          ? resolvedLengthRaw
          : normalizedCurrent.length;
        const paddedCurrent = normalizedCurrent.padStart(resolvedLength, '0');
        const paddedNext = validationResult?.nextDigits
          ? validationResult.nextDigits.padStart(resolvedLength, '0')
          : null;

        form.setFieldsValue({
          sequence: candidateDigits,
          sequenceLength: resolvedLength,
        });
        form.setFields([{ name: 'sequence', errors: [] }]);

        const formattedCurrent = `${prefix}${paddedCurrent}`;
        const nextSuffix = paddedNext
          ? `Próximo NCF disponible: ${prefix}${paddedNext}`
          : null;

        let successMessage;
        switch (meta?.source) {
          case 'before':
            successMessage = `Usaremos el último comprobante disponible antes del configurado: ${formattedCurrent}.`;
            break;
          case 'after':
            successMessage = `Secuencia ajustada a ${formattedCurrent} para usar el último NCF libre antes de uno ya emitido.`;
            break;
          case 'current':
            successMessage = `La secuencia ${formattedCurrent} ya se encuentra disponible.`;
            break;
          case 'fallback-before':
            successMessage = `Secuencia ajustada hacia atrás: ${formattedCurrent}.`;
            break;
          case 'fallback-after':
            successMessage = `Secuencia ajustada hacia adelante: ${formattedCurrent}.`;
            break;
          case 'last-used':
            successMessage = `Último comprobante emitido detectado: ${formattedCurrent}.`;
            break;
          default:
            successMessage = `Secuencia disponible encontrada: ${formattedCurrent}.`;
        }

        const messageParts = [successMessage];
        if (allowCurrentConflict) {
          messageParts.push(
            'Guardaremos esta secuencia como último comprobante emitido para continuar con el siguiente disponible.',
          );
        }
        if (nextSuffix) {
          messageParts.push(nextSuffix);
        }

        message.success(messageParts.join(' ').trim());
        return true;
      };

      const candidateQueue: CandidateAttempt[] = [];

      if (lastUsedInfo && Number.isFinite(lastUsedInfo.number)) {
        candidateQueue.push({
          number: lastUsedInfo.number,
          meta: {
            source: 'last-used',
            step: lastUsedInfo.step,
            allowCurrentConflict: true,
          },
        });
      }

      const availableBeforeList = insights.availableBefore ?? [];
      availableBeforeList.forEach((item) => {
        if (!Number.isFinite(item.number)) return;
        candidateQueue.push({
          number: item.number,
          meta: { source: 'before', step: item.step },
        });
      });

      const availableAfterList = insights.availableAfter ?? [];
      for (let index = availableAfterList.length - 1; index >= 0; index -= 1) {
        const item = availableAfterList[index];
        if (!Number.isFinite(item.number)) continue;
        candidateQueue.push({
          number: item.number,
          meta: { source: 'after', step: item.step },
        });
      }

      candidateQueue.push({
        number: baseNumber,
        meta: { source: 'current', step: 0 },
        validation: initialValidation,
      });

      for (const candidate of candidateQueue) {
        const success = await attemptCandidate(candidate);
        if (success) {
          return;
        }
      }

      const maxLookaheadRaw = Number(MAX_SEQUENCE_LOOKAHEAD);
      const maxLookahead = Number.isFinite(maxLookaheadRaw)
        ? maxLookaheadRaw
        : 0;

      for (let step = 1; step <= maxLookahead; step += 1) {
        const candidateNumber = baseNumber - increment * step;
        if (candidateNumber < 0) break;
        const success = await attemptCandidate({
          number: candidateNumber,
          meta: { source: 'fallback-before', step },
        });
        if (success) {
          return;
        }
      }

      for (let step = 1; step <= maxLookahead; step += 1) {
        const candidateNumber = baseNumber + increment * step;
        const success = await attemptCandidate({
          number: candidateNumber,
          meta: { source: 'fallback-after', step },
        });
        if (success) {
          return;
        }
      }

      message.warning(
        'No se encontró una secuencia disponible en el rango consultado.',
      );
    } catch (error) {
      console.error('Error buscando secuencia disponible:', error);
      message.error(
        'No se pudo buscar una secuencia disponible. Inténtalo nuevamente.',
      );
    } finally {
      setFindingNextSequence(false);
    }
  };

  return {
    findingNextSequence,
    handleFindNextAvailableSequence,
  };
};
