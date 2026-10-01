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
    if (!address?.isFlagged) {
      return '100%';
    }
    if (address?.status === 'created') {
      return '0%';
    }

    return `${AddressLogic.getAccuracyPercentage(address)}%`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static distanceBetweenLocation(address: any): number {
    return distanceBetweenPoints(
      address?.position?.latitude,
      address?.position?.longitude,
      address.submissionLocation?.latitude,
      address.submissionLocation?.longitude,
      'M',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static getAccuracyPercentage(address: any): string {
    const accuracyInPercentage = Number(
      (MAXIMUM_DISTANCE_LOCATION / AddressLogic.distanceBetweenLocation(address)) * 100,
    );

    return accuracyInPercentage.toFixed(2);
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
