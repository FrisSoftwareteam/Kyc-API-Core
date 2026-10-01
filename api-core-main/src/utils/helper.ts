import slug from 'slug';
import { v4 as uuidv4 } from 'uuid';

export const slugify = (str: string): string =>
  slug(str, { lower: true, replacement: '-', trim: true });

export const paginationReqData = (
  page: number,
  size: number,
): { offset: number; limit: number; pageNum: number } => {
  const pageNum = Number(page);
  const pageSize = Number(size);

  const offset = pageNum * pageSize - pageSize;

  return {
    offset,
    limit: pageSize,
    pageNum,
  };
};

export const paginationMetaData = (total: number, page: number, skip: number, limit: number) => {
  const calculeLastPage = total % limit;
  const lastPage = calculeLastPage === 0 ? total / limit : Math.trunc(total / limit) + 1;

  return {
    lastPage,
    total,
    from: skip <= total ? skip + 1 : null,
    to: total > Number(skip + limit) ? Number(skip + limit) : total,
    perPage: Number(limit),
    currentPage: Number(page),
    prevPage: page > 1 ? Number(page - 1) : null,
    nextPage: page < lastPage ? Number(page) + 1 : null,
  };
};

export const verificationCodeExpiryTime = (minutes: number) => {
  const dt = new Date();
  return new Date(dt.getTime() + minutes * 60000);
};

export const generateVerificationCode = (): string => {
  const dt = new Date();
  return parseInt(dt.getTime().toString()).toString().slice(-6);
};

export const getVerificationCodeAndExpiry = (minutes: number) => {
  return {
    expiryTime: verificationCodeExpiryTime(minutes),
    verificationCode: generateVerificationCode(),
    verificationToken: uuidv4(),
  };
};

export const generateUniqueReference = (prefix?: string) => {
  return prefix ? `${prefix}-${uuidv4()}` : uuidv4();
};

export const distanceBetweenPoints = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unit: 'K' | 'M' = 'K',
): number => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }

  const toRad = (deg: number) => deg * (Math.PI / 180);

  const R = 6371; // km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c * 1000; // meters
};

// export const distanceBetweenPoints = (
//   latitude1: number,
//   longitude1: number,
//   latitude2: number,
//   longitude2: number,
//   unit: string,
// ): number => {
//   if (latitude1 == latitude2 && longitude1 == longitude2) {
//     return 0;
//   } else {
//     const radiusLatitude1 = (Math.PI * latitude1) / 180;
//     const radiusLatitude2 = (Math.PI * latitude2) / 180;
//     const theta = longitude1 - longitude2;
//     const radiusTheta = (Math.PI * theta) / 180;
//     let distance =
//       Math.sin(radiusLatitude1) * Math.sin(radiusLatitude2) +
//       Math.cos(radiusLatitude1) * Math.cos(radiusLatitude2) * Math.cos(radiusTheta);
//     if (distance > 1) {
//       distance = 1;
//     }
//     distance = Math.acos(distance);
//     distance = (distance * 180) / Math.PI;
//     distance = distance * 60 * 1.1515;
//
//     if (unit.toLowerCase() === 'k') {
//       distance = distance * 1.609344;
//     }
//     if (unit.toLowerCase() === 'm') {
//       distance = distance * 1609.344;
//     }
//     if (unit.toLowerCase() === 'n') {
//       distance = distance * 0.8684;
//     }
//
//     return distance;
//   }
// };
