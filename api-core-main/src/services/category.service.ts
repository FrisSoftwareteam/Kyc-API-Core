import { CategoryInput, UpdateCategoryInput } from '../schemas/category.schema';
import { slugify } from '../utils/helper';
import { NotFoundError } from '../errors/api.error';
import CategoryFormatter, { ICategoryFormatter } from '../formatters/category.formatter';
import ServiceFormatter, { IServiceFormatter } from '../formatters/service.formatter';

export default class CategoryService {
  private readonly config;
  private readonly ServiceDataAccess;
  private readonly CategoryDataAccess;

  constructor({
    config,
    ServiceDataAccess,
    CategoryDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.ServiceDataAccess = ServiceDataAccess;
    this.CategoryDataAccess = CategoryDataAccess;
  }

  async fetchAll(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; category: ICategoryFormatter[] }> {
    const { CategoryDataAccess } = this;
    const { status } = query;

    const category = await CategoryDataAccess.all({ status });

    return category?.map((category: Record<string, unknown>) => CategoryFormatter({ category }));
  }

  async create(payload: CategoryInput): Promise<ICategoryFormatter> {
    const { CategoryDataAccess } = this;

    const category = await CategoryDataAccess.create({
      ...payload,
      slug: slugify(payload.name),
    });

    return CategoryFormatter({ category });
  }

  async fetchById(categoryId: string): Promise<ICategoryFormatter | Error> {
    const { CategoryDataAccess } = this;

    const category = await CategoryDataAccess.findCategoryById(categoryId);

    if (!category) {
      throw new NotFoundError('Category not found', { code: 'CATEGORY_NOT_FOUND' });
    }

    return CategoryFormatter({ category });
  }

  async fetchServices(categoryId: string): Promise<IServiceFormatter[]> {
    const { ServiceDataAccess } = this;

    await this.fetchById(categoryId);

    const services = await ServiceDataAccess.findServicesByCategory(categoryId);

    return services.map((service: Record<string, unknown>) => ServiceFormatter({ service }));
  }

  async updateCategory(categoryId: string, payload: UpdateCategoryInput): Promise<string> {
    const { CategoryDataAccess } = this;

    await CategoryDataAccess.updateCategoryById(categoryId, {
      ...payload,
      ...(payload?.name ? { slug: slugify(payload.name) } : undefined),
    });

    return 'Category Updated Successfully';
  }
}
