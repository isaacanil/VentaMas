
export const quitarCeros = (s) => {
    const n = s.toString()
    return Number(n.replace(/^0+/, ''));
}