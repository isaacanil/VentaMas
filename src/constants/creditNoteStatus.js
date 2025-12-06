export const CREDIT_NOTE_STATUS = {
  ISSUED: 'issued',
  APPLIED: 'applied',
  FULLY_USED: 'fully_used',
  CANCELLED: 'cancelled',
};

export const CREDIT_NOTE_STATUS_LABEL = {
  [CREDIT_NOTE_STATUS.ISSUED]: 'Emitida',
  [CREDIT_NOTE_STATUS.APPLIED]: 'Aplicada',
  [CREDIT_NOTE_STATUS.FULLY_USED]: 'Utilizada Completamente',
  [CREDIT_NOTE_STATUS.CANCELLED]: 'Anulada',
};

export const CREDIT_NOTE_STATUS_COLOR = {
  [CREDIT_NOTE_STATUS.ISSUED]: 'blue',
  [CREDIT_NOTE_STATUS.APPLIED]: 'green',
  [CREDIT_NOTE_STATUS.FULLY_USED]: 'orange',
  [CREDIT_NOTE_STATUS.CANCELLED]: 'red',
};
