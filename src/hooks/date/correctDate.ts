export const correctDate = (date: string | number | Date) => {
  const r = new Date(date);
  r.setMinutes(r.getMinutes() + r.getTimezoneOffset());
  return r;
};
export const getDateFromTimestamp = (timestamp: { seconds: number }) => {
  const date = new Date(timestamp.seconds * 1000);

  return date;
};
