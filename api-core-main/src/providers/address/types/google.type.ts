export interface IGeocodePointResponse {
  longitude: number;
  latitude: number;
}

export interface GoogleClientInterface {
  geocodeAddress(address: string): Promise<IGeocodePointResponse>;
}
