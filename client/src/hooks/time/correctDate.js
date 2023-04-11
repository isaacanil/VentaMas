export const correctDate = (date) =>{
    const r = new Date(date)
    r.setMinutes(r.getMinutes() + r.getTimezoneOffset())
    return r
}