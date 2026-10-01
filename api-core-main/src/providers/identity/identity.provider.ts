import { REDIS_LOCATION_KEY } from '../../constants';
import YouverifyProvider from './youverify.identity';
import { BadRequestError } from '../../errors/api.error';

export default class IdentityProvider {
  private readonly logger;
  private readonly config;
  private readonly RedisClient;
  private readonly BvnDataAccess;
  private integrationType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private integrationProvider: any;
  private readonly NinDataAccess;
  private readonly ServiceDataAccess;
  private readonly PassportDataAccess;
  private readonly ProviderDataAccess;
  private readonly CloudinaryUploader;
  private readonly DriverLicenseDataAccess;

  constructor({
    logger,
    config,
    RedisClient,
    BvnDataAccess,
    NinDataAccess,
    ServiceDataAccess,
    ProviderDataAccess,
    PassportDataAccess,
    CloudinaryUploader,
    DriverLicenseDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.logger = logger;
    this.config = config;
    this.RedisClient = RedisClient;
    this.NinDataAccess = NinDataAccess;
    this.BvnDataAccess = BvnDataAccess;
    this.ServiceDataAccess = ServiceDataAccess;
    this.ProviderDataAccess = ProviderDataAccess;
    this.PassportDataAccess = PassportDataAccess;
    this.CloudinaryUploader = CloudinaryUploader;
    this.DriverLicenseDataAccess = DriverLicenseDataAccess;
  }

  async setVerificationType(type: string) {
    this.integrationType = type;

    await this.switchProvider(type);

    return this;
  }

  public async getIntegrationProvider(verificationType: string) {
    const { RedisClient, ServiceDataAccess, logger } = this;

    let integrationProvider = await RedisClient.hGet(
      REDIS_LOCATION_KEY.PROVIDER,
      verificationType?.toLowerCase(),
    );

    if (!integrationProvider) {
      integrationProvider = await ServiceDataAccess.findServiceBySlug(verificationType);

      if (!integrationProvider?.provider) {
        logger.error(
          `No Active Provider for Set on the database for ${integrationProvider?.provider}, reach out to admin`,
        );

        return null;
      }
      await RedisClient.hSet(
        REDIS_LOCATION_KEY.PROVIDER,
        verificationType?.toLowerCase(),
        integrationProvider?.provider?.slug,
      );

      integrationProvider = integrationProvider?.provider?.slug;
    }

    if (!integrationProvider) {
      logger.error(`No Active Provider for Set for ${integrationProvider}, reach out to admin`);

      return null;
    }

    return integrationProvider;
  }

  async switchProvider(type: string) {
    const { logger, config, integrationType } = this;

    const activeProvider = await this.getIntegrationProvider(integrationType);

    switch (`${type.toLowerCase()}_${activeProvider}`) {
      case 'bvn_youverify':
        this.integrationProvider = new YouverifyProvider({ config, logger });
        break;
      case 'nin_youverify':
        this.integrationProvider = new YouverifyProvider({ config, logger });
        break;
      case 'vnin_youverify':
        this.integrationProvider = new YouverifyProvider({ config, logger });
        break;
      case 'driver-license_youverify':
        this.integrationProvider = new YouverifyProvider({ config, logger });
        break;
      case 'international-passport_youverify':
        this.integrationProvider = new YouverifyProvider({ config, logger });
        break;
      case 'aml_youverify':
        this.integrationProvider = new YouverifyProvider({ config, logger });
        break;
      default:
        logger.error(`No Provider Set for ${type}, reach out to admin`);
        throw new BadRequestError('Something went wrong');
    }
  }

  async fetchBvn(bvn: string, country: string, premiumBVN?: boolean) {
    const { CloudinaryUploader } = this;

    let bvnData = await this.fetchBvnFromLocal(bvn);

    if (!bvnData) {
      bvnData = await this.integrationProvider.fetchBvn(bvn, country, premiumBVN);

      if (!bvnData?.status) {
        return {
          ...bvnData,
          failedReason: bvnData.message,
          status: false,
        };
      }

      bvnData.imageUrl = await CloudinaryUploader.uploadBase64(bvnData.imageUrl, 'images/bvn', bvn);

      bvnData = await this.saveBvnToLocal(bvnData);
    }

    return {
      ...bvnData,
      status: true,
      chargeIdentity: true,
    };
  }

  async fetchBvnFromLocal(bvn: string) {
    const { BvnDataAccess } = this;

    const bvnData = await BvnDataAccess.findByBvn(bvn);

    if (bvnData) {
      return bvnData;
    }

    return null;
  }

  async saveBvnToLocal(payload: Record<string, unknown>) {
    const { BvnDataAccess } = this;

    const bvnData = await BvnDataAccess.createBvn(payload);

    return bvnData;
  }

  async fetchNin(nin: string, country: string) {
    const { CloudinaryUploader } = this;

    let ninData = await this.fetchNinFromLocal(nin);

    if (!ninData) {
      ninData = await this.integrationProvider.fetchNin(nin, country);

      if (!ninData?.status) {
        return {
          ...ninData,
          failedReason: ninData.message,
          status: false,
        };
      }

      ninData.imageUrl = await CloudinaryUploader.uploadBase64(
        ninData.imageUrl,
        'images/nin/pictures',
        nin,
      );

      if (ninData?.signatureUrl) {
        ninData.signatureUrl = await CloudinaryUploader.uploadBase64(
          ninData.signatureUrl,
          'images/nin/signatures',
          nin,
        );
      }

      ninData = await this.saveNinToLocal(ninData);
    }

    return {
      ...ninData,
      status: true,
      chargeIdentity: true,
    };
  }

  async fetchNinFromLocal(nin: string) {
    const { NinDataAccess } = this;

    const ninData = await NinDataAccess.findByNin(nin);

    if (ninData) {
      return ninData;
    }

    return null;
  }

  async saveNinToLocal(payload: Record<string, unknown>) {
    const { NinDataAccess } = this;

    const ninData = await NinDataAccess.createNin(payload);

    return ninData;
  }

  async fetchDriverLicense(id: string, country: string) {
    const { CloudinaryUploader } = this;

    let driverLicenseData = await this.fetchDriverLicenseFromLocal(id);

    if (!driverLicenseData) {
      driverLicenseData = await this.integrationProvider.fetchDriverLicense(id, country);

      if (!driverLicenseData?.status) {
        return {
          ...driverLicenseData,
          failedReason: driverLicenseData.message,
          status: false,
        };
      }

      driverLicenseData.imageUrl = await CloudinaryUploader.uploadBase64(
        driverLicenseData.imageUrl,
        'images/dl/pictures',
        id,
      );

      driverLicenseData = await this.saveDriverLicenseToLocal(driverLicenseData);
    }

    return {
      ...driverLicenseData,
      status: true,
      chargeIdentity: true,
    };
  }

  async fetchDriverLicenseFromLocal(id: string) {
    const { DriverLicenseDataAccess } = this;

    const driverLicenseData = await DriverLicenseDataAccess.findByDriverLicense(id);

    if (driverLicenseData) {
      return driverLicenseData;
    }

    return null;
  }

  async saveDriverLicenseToLocal(payload: Record<string, unknown>) {
    const { DriverLicenseDataAccess } = this;

    const driverLicenseData = await DriverLicenseDataAccess.createDriverLicense(payload);

    return driverLicenseData;
  }

  async fetchPassport(id: string, country: string, lastName?: string) {
    const { CloudinaryUploader } = this;

    let passportData = await this.fetchPassportFromLocal(id);

    if (!passportData) {
      passportData = await this.integrationProvider.fetchPassport(id, country, lastName);

      if (!passportData?.status) {
        return {
          ...passportData,
          failedReason: passportData.message,
          status: false,
        };
      }

      passportData.imageUrl = await CloudinaryUploader.uploadBase64(
        passportData.imageUrl,
        'images/passport/pictures',
        id,
      );

      passportData = await this.savePassportToLocal({
        ...passportData,
        passportNumber: passportData.idNumber,
      });
    }

    return {
      ...passportData,
      status: true,
      chargeIdentity: true,
    };
  }

  async fetchPassportFromLocal(id: string) {
    const { PassportDataAccess } = this;

    const passportData = await PassportDataAccess.findByPassport(id);

    if (passportData) {
      return passportData;
    }

    return null;
  }

  async savePassportToLocal(payload: Record<string, unknown>) {
    const { PassportDataAccess } = this;

    const passportData = await PassportDataAccess.createPassport(payload);

    return passportData;
  }

  async fetchAml(name: string, type: string) {
    const amlData = await this.integrationProvider.fetchAml(name, type);

    if (!amlData?.status) {
      return {
        ...amlData,
        failedReason: amlData.message,
        status: false,
      };
    }

    return {
      ...amlData,
      status: true,
      chargeIdentity: true,
    };
  }
}
