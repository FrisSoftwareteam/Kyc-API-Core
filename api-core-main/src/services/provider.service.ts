import {
  CreateProviderInput,
  UpdateProviderInput,
  SetProviderInput,
} from '../schemas/provider.schema';
import { slugify } from '../utils/helper';
import { NotFoundError } from '../errors/api.error';
import { paginationReqData, paginationMetaData } from '../utils/helper';
import ProviderFormatter, { IProviderFormatter } from '../formatters/provider.formatter';
import { REDIS_LOCATION_KEY } from '../constants';

export default class ProviderService {
  private readonly config;
  private readonly ProviderDataAccess;
  private readonly RedisClient;

  constructor({
    config,
    RedisClient,
    ProviderDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.ProviderDataAccess = ProviderDataAccess;
    this.RedisClient = RedisClient;
  }

  async findProviderById(providerId: string) {
    const { ProviderDataAccess } = this;

    const provider = await ProviderDataAccess.findProviderById(providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found', { code: 'PROVIDER_NOT_FOUND' });
    }

    return provider;
  }

  async fetchAll(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; providers: IProviderFormatter[] }> {
    const { ProviderDataAccess } = this;
    const { page = 1, size = 20, status } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [providers] = await ProviderDataAccess.all({ status }, { offset, limit });

    const meta = paginationMetaData(providers?.metadata[0]?.total, pageNum, offset, size as number);

    return {
      meta,
      providers: providers?.data?.map((provider: Record<string, unknown>) =>
        ProviderFormatter({ provider }),
      ),
    };
  }

  async create(payload: CreateProviderInput): Promise<IProviderFormatter> {
    const { ProviderDataAccess, RedisClient } = this;

    const provider = await ProviderDataAccess.create({
      ...payload,
      slug: slugify(payload.name),
    });

    await RedisClient.hSet(REDIS_LOCATION_KEY.PROVIDER, payload.service, slugify(payload.name));

    return ProviderFormatter({ provider });
  }

  async fetchById(providerId: string): Promise<IProviderFormatter | Error> {
    const provider = await this.findProviderById(providerId);

    return ProviderFormatter({ provider });
  }

  async updateProvider(providerId: string, payload: UpdateProviderInput): Promise<string> {
    const { ProviderDataAccess } = this;

    await ProviderDataAccess.updateProviderById(providerId, {
      ...payload,
      ...(payload?.name ? { slug: slugify(payload.name) } : undefined),
    });

    return 'Provider Updated Successfully';
  }

  async setProvider(payload: SetProviderInput): Promise<string> {
    const { RedisClient } = this;

    const provider = await this.findProviderById(payload.provider);

    const providerTypes = Object.keys(provider.prices);

    if (!providerTypes.includes(payload.type)) {
      throw new NotFoundError('Provider Identity Type Not Available', {
        code: 'PROVIDER_IDENTITY_NOT_FOUND',
      });
    }

    await RedisClient.hSet(REDIS_LOCATION_KEY.PROVIDER, payload.type.toLowerCase(), provider.slug);

    return 'Provider Updated Successfully';
  }
}
