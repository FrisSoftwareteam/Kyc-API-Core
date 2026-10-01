import { Types } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deepObjectIdToString = (value: Record<string, any>): any => {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(deepObjectIdToString);
  }

  if (value instanceof Object) {
    return Object.entries(value).reduce(
      (acc, [innerKey, innerValue]) => ({
        ...acc,
        [innerKey]: deepObjectIdToString(innerValue),
      }),
      {},
    );
  }

  return value;
};
