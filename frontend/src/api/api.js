export const extractResults = (res) => {
  const data = res.data?.results ?? res.data;
  return Array.isArray(data) ? data : [data]; // force into array
};
