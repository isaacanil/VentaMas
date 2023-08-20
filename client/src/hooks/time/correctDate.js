export const correctDate = (date) =>{
    const r = new Date(date)
    r.setMinutes(r.getMinutes() + r.getTimezoneOffset())
    return r
}
export const getDateFromTimestamp = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    
    return date;
}