export const increaseSequence = (sequence, increase, maxCharacters) => {
    let result = Number(sequence) + Number(increase);
    result = result.toString();
    result = result.slice(-maxCharacters);
    result = result.padStart(maxCharacters, '0');
    return result;
}

export const generateNCFCode = (receiptData) => {
    if (receiptData) {
        const { type, serie, sequence, increase, quantity, name: _name, id: _id } = receiptData.data;

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
            ncfCode: ncfCode
        };
    } else {
        throw new Error('No data provided');
    }
}
