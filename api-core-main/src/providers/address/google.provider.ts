import axios from 'axios';
import { deepObjectIdToString } from '../../utils/string';
import { IGeocodePointResponse, GoogleClientInterface } from './types/google.type';
import { BadRequestError } from '../../errors/api.error';

export interface IReverseGeocodePointRequest {
  longitude: number;
  latitude: number;
}

export default class GoogleClientProvider implements GoogleClientInterface {
  private readonly url: string;
  private readonly apiKey: string;
  private readonly logger;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config, logger }: any) {
    const url = config.get('google.url');
    const apiKey = config.get('google.apiKey');

    this.apiKey = apiKey;
    this.logger = logger;
    this.url = url;
  }

  // async reverseGeocodePoint({ latitude, longitude }: IReverseGeocodePointRequest) {
  // const { url, apiKey } = this;
  // const response = await axios.get('json', {
  //   params: {
  //     key: apiKey,
  //     latlng: `${latitude},${longitude}`,
  //   },
  // });
  // return response.results;
  // }

  async geocodeAddress(address: string): Promise<IGeocodePointResponse> {
    // return {
    //   latitude: 6.569943599999999,
    //   longitude: 3.3730988,
    // };
    const { url, apiKey, logger } = this;

    const start = new Date();

    const request = {
      method: 'GET',
      url: `${url}/geocode/json`,
      params: deepObjectIdToString({
        key: apiKey,
        address,
      }),
      validateStatus: () => true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await axios(request);

    const elapsed = +new Date() - +start;

    logger.debug('google geocode response', {
      url,
      params: {
        key: apiKey,
        address,
      },
      start,
      elapsed,
      status: response.status,
    });

    if (response.data.status !== 'OK') {
      logger.error(JSON.stringify(response.data));
      throw new BadRequestError('Something went wrong', {
        code: 'ADDRESS_NOT_GEOCODE',
      });
    }

    return {
      longitude: response.data.results[0]?.geometry?.location?.lng,
      latitude: response.data.results[0]?.geometry?.location?.lat,
    };
  }
}
