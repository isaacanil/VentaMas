export const increaseSequence = (sequence, increase, maxCharacters) => {
    let result = Number(sequence) + Number(increase)
    result = result.toString()
    result = result.slice(-maxCharacters);
    result = result.substring(0, maxCharacters);
    result = result.padStart(maxCharacters, "0")
    return result
}