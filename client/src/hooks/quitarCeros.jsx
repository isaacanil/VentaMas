
export const quitarCeros = (s) => {
    const n = s.toString()
    return n.replace(/^0+/, '');
}