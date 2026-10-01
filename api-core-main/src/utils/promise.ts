// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const once = (func: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = null;
  
  return async () => {
    if (result !== null) return result;
    result = func();
    return result;
  };
};
  