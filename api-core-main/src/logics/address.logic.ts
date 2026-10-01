import { AddressInput } from '../schemas/address.schema';
import { AddressFormatKeys, GOOGLE_MAP_URL, MAXIMUM_DISTANCE_LOCATION } from '../constants';
import { distanceBetweenPoints } from '../utils/helper';

export default class AddressLogic {
  public static stringifyAddress(addressRequest: AddressInput): string {
    const stringifyAddress: string = AddressFormatKeys.reduce((acc: string, key: string) => {
      const value = addressRequest ? addressRequest[key as keyof AddressInput] : undefined;

      if (value) {
        return acc === '' ? value : `${acc}, ${value}`;
      }

      return acc;
    }, '');

    return stringifyAddress;
  }

  public static generateGoogleMapAddressLink(address: string): string {
    return `${GOOGLE_MAP_URL}/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  public static generateGoogleMapGeocodeLink(latitude: string, longitude: string): string {
    return `${GOOGLE_MAP_URL}/?q=${latitude},${longitude}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static calculateAccuracy(address: any): string {
    // if (!address?.isFlagged) {
    //   return '100%';
    // }

    if (address?.status === 'created') {
      return '0%';
    }

    return `${AddressLogic.getAccuracyPercentage(address)}%`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static distanceBetweenLocation(address: any): number {
    const lat1 = address?.position?.latitude;
    const lon1 = address?.position?.longitude;
    const lat2 = address?.submissionLocation?.latitude;
    const lon2 = address?.submissionLocation?.longitude;

    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return 0;
    }

    return distanceBetweenPoints(lat1, lon1, lat2, lon2, 'K');
  }

  // public static distanceBetweenLocation(address: any): number {
  //   if (
  //     !address?.position?.latitude ||
  //     !address?.position?.longitude ||
  //     !address?.submissionLocation?.latitude ||
  //     !address?.submissionLocation?.longitude
  //   ) {
  //     return 0;
  //   }
  //
  //   return distanceBetweenPoints(
  //     address.position.latitude,
  //     address.position.longitude,
  //     address.submissionLocation.latitude,
  //     address.submissionLocation.longitude,
  //     'M'
  //   );
  // }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // public static getAccuracyPercentage(address: any): string {
  //   const distance = AddressLogic.distanceBetweenLocation(address);
  //
  //   if (distance === 0) return '0.00';
  //
  //   const accuracy = (MAXIMUM_DISTANCE_LOCATION / distance) * 100;
  //
  //   return Math.min(accuracy, 100).toFixed(2);
  // }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static getAccuracyPercentage(address: any): string {
    const distance = AddressLogic.distanceBetweenLocation(address);

    if (distance === 0) return '100.00';

    // const accuracy = (1 - distance / MAXIMUM_DISTANCE_LOCATION) * 100;
    const accuracy = Math.exp(-distance / MAXIMUM_DISTANCE_LOCATION) * 100;

    return Math.max(0, Math.min(100, accuracy)).toFixed(2);
  }

  public static generateGoogleMapRouteLink(
    latitude: string,
    longitude: string,
    agentLatitude: string,
    agentLongitude: string,
  ): string {
    return `${GOOGLE_MAP_URL}/dir/${latitude},${longitude}/${agentLatitude},${agentLongitude}`;
  }
}
