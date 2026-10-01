export default class OtherTaskService {
  private readonly config;
  private readonly RedisClient;
  private readonly OtherTaskDataAccess;

  constructor({
    config,
    RedisClient,
    OtherTaskDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.RedisClient = RedisClient;
    this.OtherTaskDataAccess = OtherTaskDataAccess;
  }
}
