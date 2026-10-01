export default class UserService {
  private readonly UserDataAccess;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ UserDataAccess }: Record<string, any>) {
    this.UserDataAccess = UserDataAccess;
  }

  async create() {
    const { UserDataAccess } = this;

    const data = await UserDataAccess.create();

    return data;
  }
}
