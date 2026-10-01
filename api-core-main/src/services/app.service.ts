export default class AppService {
  private readonly AppDataAccess;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ AppDataAccess }: Record<string, any>) {
    this.AppDataAccess = AppDataAccess;
  }

  async create(): Promise<typeof AppDataAccess> {
    const { AppDataAccess } = this;

    const app = AppDataAccess.create();

    return app;
  }
}