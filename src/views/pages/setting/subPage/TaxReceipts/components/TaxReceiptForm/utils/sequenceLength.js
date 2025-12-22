export const createSequenceLengthResolver = ({
  currentSequence,
  currentSequenceLength,
} = {}) => {
  const initialLength = (() => {
    if (currentSequence === undefined || currentSequence === null) return null;
    const length = String(currentSequence).length;
    return Number.isFinite(length) && length > 0 ? length : null;
  })();

  const normalizedCurrentLength = Number(currentSequenceLength);
  const normalizedCandidates = [
    Number.isFinite(normalizedCurrentLength) && normalizedCurrentLength > 0
      ? normalizedCurrentLength
      : null,
    initialLength,
  ].filter((value) => Number.isFinite(value) && value > 0);

  return (normalizedDigitsLength, customSequenceLength) => {
    const normalizedDigitsCandidate = Number(normalizedDigitsLength);
    const customLengthCandidate = Number(customSequenceLength);

    const candidates = [
      ...normalizedCandidates,
      Number.isFinite(customLengthCandidate) && customLengthCandidate > 0
        ? customLengthCandidate
        : null,
      Number.isFinite(normalizedDigitsCandidate) &&
      normalizedDigitsCandidate > 0
        ? normalizedDigitsCandidate
        : null,
    ].filter((value) => Number.isFinite(value) && value > 0);

    if (candidates.length === 0) {
      return Number.isFinite(normalizedDigitsCandidate)
        ? normalizedDigitsCandidate
        : (normalizedCandidates[0] ?? 0);
    }

    return Math.max(...candidates);
  };
};
