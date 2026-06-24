


export const minutesAfterMidnight = (date: number | Date) => {
  date = new Date(date);
  return date.getHours() * 60 + date.getMinutes();
};

/* Convert dates back to timestamps (Used by Yup / zod for validation)*/
export const toTimestamp = (value: unknown, originalValue?: unknown) => {
  const raw = originalValue ?? value;

  return raw instanceof Date ? raw.getTime() : value;
};
