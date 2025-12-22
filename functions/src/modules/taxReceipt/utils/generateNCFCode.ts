export const increaseSequence = (
  sequence: string | number,
  increase: string | number,
  maxCharacters: number,
): string => {
  let result = Number(sequence) + Number(increase);
  let resultStr = result.toString();
  resultStr = resultStr.slice(-maxCharacters);
  resultStr = resultStr.padStart(maxCharacters, '0');
  return resultStr;
};

export interface ReceiptData {
  data: {
    type: string;
    serie: string;
    sequence: string | number;
    increase: string | number;
    quantity: string | number;
    name?: string;
    id?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const generateNCFCode = (
  receiptData: ReceiptData,
): { updatedData: ReceiptData['data']; ncfCode: string } => {
  if (receiptData) {
    const { type, serie, sequence, increase, quantity } = receiptData.data;

    // Increment the sequence
    const updatedSequence = increaseSequence(sequence, increase, 10);

    const updatedQuantity = Number(quantity) - Number(increase);

    receiptData.data.quantity = updatedQuantity;

    // Build the NCF code
    const ncfCode = type + serie + updatedSequence;

    // Update the receipt data
    receiptData.data.sequence = updatedSequence;

    return {
      updatedData: receiptData.data,
      ncfCode: ncfCode,
    };
  } else {
    throw new Error('No data provided');
  }
};
