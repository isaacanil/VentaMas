export const CREDIT_NOTE_TEXT_CORRECTION_CODE = '2';

export const CREDIT_NOTE_TEXT_CORRECTION_AMOUNT_MESSAGE =
  'El código DGII 2 corrige texto y solo permite montos en 0. Para una nota con importe, use el código 3 - Corrige montos.';

export const hasPositiveCreditNoteAmount = (totalAmount: unknown): boolean => {
  const numericAmount = Number(totalAmount);
  return Number.isFinite(numericAmount) && numericAmount > 0.004;
};

export const isCreditNoteTextCorrectionWithAmount = ({
  modificationCode,
  totalAmount,
}: {
  modificationCode: unknown;
  totalAmount: unknown;
}): boolean =>
  String(modificationCode ?? '').trim() === CREDIT_NOTE_TEXT_CORRECTION_CODE &&
  hasPositiveCreditNoteAmount(totalAmount);
