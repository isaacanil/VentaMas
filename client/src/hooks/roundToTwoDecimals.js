export const useRoundDecimals = (n) => {
    return Math.round(n * 100) / 100;
}