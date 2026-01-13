// @ts-nocheck
import { message } from 'antd';
import { useState } from 'react';

import {
  buildPrefix,
  normalizeDigits,
  resolveIncrement,
  toDigits,
} from '../utils/ncfUtils';
import { MAX_SEQUENCE_LOOKAHEAD } from '../utils/sequenceConflicts';

export const useSequenceFinder = ({
  form,
  resolveSequenceLength,
  checkSequenceConflicts,
} = {}) => {
  const [findingNextSequence, setFindingNextSequence] = useState(false);

  const handleFindNextAvailableSequence = async () => {
    if (findingNextSequence) return;
    if (!form) return;

    const currentValues = form.getFieldsValue();
    const prefix = buildPrefix(currentValues.type, currentValues.serie);

    if (!prefix) {
      message.warning(
        'Completa la serie y el tipo antes de buscar disponibilidad.',
      );
      return;
    }

    const digits = toDigits(currentValues.sequence ?? '');
    if (!digits) {
      message.warning(
        'Ingresa una secuencia numérica para buscar disponibilidad.',
      );
      return;
    }

    const normalizedDigits = normalizeDigits(digits);
    const baseNumber = Number(normalizedDigits);

    if (!Number.isFinite(baseNumber)) {
      message.error('Secuencia inválida para sugerir disponibilidad.');
      return;
    }

    const increment = resolveIncrement(currentValues.increase);
    setFindingNextSequence(true);

    const resolver =
      typeof resolveSequenceLength === 'function'
        ? resolveSequenceLength
        : (length) => length;

    try {
      let initialValidation;
      try {
        initialValidation = await checkSequenceConflicts?.(currentValues);
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

      const testedNumbers = new Set();
      const insights = initialValidation?.insights ?? {};
      const lastUsedInfo = insights?.lastUsed;

      const attemptCandidate = async ({ number, meta, validation }) => {
        if (!Number.isFinite(number)) return false;
        const roundedNumber = Math.max(Math.floor(number), 0);
        if (testedNumbers.has(roundedNumber)) return false;
        testedNumbers.add(roundedNumber);

        const candidateDigits = roundedNumber.toString();
        const candidateValues = { ...currentValues, sequence: candidateDigits };

        let validationResult = validation;
        if (!validationResult) {
          try {
            validationResult = await checkSequenceConflicts?.(candidateValues);
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
        const resolvedLength = resolver(
          Math.max(
            normalizedCurrent.length,
            validationResult?.nextDigitsLength ?? normalizedCurrent.length,
          ),
          candidateValues.sequenceLength,
        );
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

        message.success(messageParts.filter(Boolean).join(' ').trim());
        return true;
      };

      const candidateQueue = [];

      if (lastUsedInfo) {
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
        candidateQueue.push({
          number: item.number,
          meta: { source: 'before', step: item.step },
        });
      });

      const availableAfterList = insights.availableAfter ?? [];
      for (let index = availableAfterList.length - 1; index >= 0; index -= 1) {
        const item = availableAfterList[index];
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

      for (let step = 1; step <= MAX_SEQUENCE_LOOKAHEAD; step += 1) {
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

      for (let step = 1; step <= MAX_SEQUENCE_LOOKAHEAD; step += 1) {
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
