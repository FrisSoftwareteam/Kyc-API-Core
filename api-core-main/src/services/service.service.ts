import { CreateServiceInput, UpdateServiceInput } from '../schemas/service.schema';
import { slugify } from '../utils/helper';
import { NotFoundError } from '../errors/api.error';
import ServiceFormatter, { IServiceFormatter } from '../formatters/service.formatter';

export default class ServiceService {
  private readonly config;
  private readonly ServiceDataAccess;

  constructor({
    config,
    ServiceDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.ServiceDataAccess = ServiceDataAccess;
  }

  async fetchAll(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; services: IServiceFormatter[] }> {
    const { ServiceDataAccess } = this;
    const { status } = query;

    const services = await ServiceDataAccess.all({ status });

    return services?.map((service: Record<string, unknown>) => ServiceFormatter({ service }));
  }

  async create(payload: CreateServiceInput): Promise<IServiceFormatter> {
    const { ServiceDataAccess } = this;

    const service = await ServiceDataAccess.create({
      ...payload,
      slug: slugify(payload.name),
    });

    return ServiceFormatter({ service });
  }

  async fetchById(serviceId: string): Promise<IServiceFormatter | Error> {
    const { ServiceDataAccess } = this;

    const service = await ServiceDataAccess.findServiceById(serviceId);

    if (!service) {
      throw new NotFoundError('Service not found', { code: 'SERVICE_NOT_FOUND' });
    }

    return ServiceFormatter({ service });
  }

  async updateService(serviceId: string, payload: UpdateServiceInput): Promise<string> {
    const { ServiceDataAccess } = this;

    await ServiceDataAccess.updateServiceById(serviceId, {
      ...payload,
      ...(payload?.name ? { slug: slugify(payload.name) } : undefined),
    });

    return 'Service has been updated successfully';
  }
}
