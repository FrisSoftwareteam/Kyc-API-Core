import axios from 'axios';
import {
  IYouverifyAxiosNinResponse,
  INinResponse,
  IBvnResponse,
  IYouverifyAxiosBvnResponse,
  ICreateIndividualRiskCheckYouverifyResponse,
  ICreateBusinessRiskCheckYouverifyResponse,
  ICreateIndividualRiskCheckResponse,
  ICreateBusinessRiskCheckResponse,
  ICreateIndividualRiskCheck,
  ICreateBusinessRiskCheck,
  IYouverifyAxiosPassportResponse,
  IPassportResponse,
  IChargeData,
  IYouverifyAxiosDriverLicenseResponse,
  IDriverLicenseResponse,
  IYouverifyAxiosAmlResponse,
  IAmlResponse,
} from './types/identity.type';

export default class YouverifyIdentity {
  private readonly ApiKey: string;
  private readonly Url: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config }: any) {
    this.Url = config.get('youverify.baseUrl');
    this.ApiKey = config.get('youverify.apiKey');
  }

  async fetchBvn(
    bvn: string,
    countryCode: string,
    premiumBVN?: boolean,
  ): Promise<IBvnResponse | IChargeData> {
    const { ApiKey, Url } = this;

    const request = {
      method: 'POST',
      url: `${Url}/identity/${countryCode.toLowerCase()}/bvn`,
      data: {
        isSubjectConsent: true,
        id: bvn,
        ...(premiumBVN ? { premiumBVN } : undefined),
      },
      headers: {
        token: ApiKey,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IYouverifyAxiosBvnResponse>(request);

    if (!data.success) {
      return {
        status: false,
        message: data.message,
        chargeIdentity: true,
      };
    }

    return {
      status: true,
      firstName: data?.data?.firstName,
      bvn: data?.data?.idNumber,
      lastName: data?.data?.lastName,
      middleName: data?.data?.middleName,
      dateOfBirth: data?.data?.dateOfBirth,
      imageUrl: data?.data?.image,
      gender: data?.data?.gender || 'N/A',
      phoneNumber: data?.data?.mobile,
    };
  }

  async fetchNin(nin: string, countryCode: string): Promise<INinResponse | IChargeData> {
    const { ApiKey, Url } = this;

    const request = {
      method: 'POST',
      url: `${Url}/identity/${countryCode.toLowerCase()}/nin`,
      data: {
        isSubjectConsent: true,
        id: nin,
      },
      validateStatus: () => true,
      headers: {
        token: ApiKey,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IYouverifyAxiosNinResponse>(request);

    if (!data.success) {
      return {
        status: false,
        message: data.message,
        chargeIdentity: true,
      };
    }

    return {
      status: true,
      firstName: data?.data?.firstName,
      nin: data?.data?.idNumber,
      lastName: data?.data?.lastName,
      middleName: data?.data?.middleName,
      dateOfBirth: data?.data?.dateOfBirth,
      imageUrl: data?.data?.image,
      signatureUrl: data?.data?.signature,
      gender: data?.data?.gender || 'N/A',
      phoneNumber: data?.data?.mobile,
      birthState: data?.data?.birthState,
      nextOfKinState: data?.data?.nokState,
      religion: data?.data?.religion,
      birthLGA: data?.data?.birthLGA,
      birthCountry: data?.data?.birthCountry,
      country: data?.data?.country,
    };
  }

  async createIndividualRiskCheck(
    payload: ICreateIndividualRiskCheck,
  ): Promise<ICreateIndividualRiskCheckResponse> {
    const { ApiKey, Url } = this;

    const request = {
      method: 'POST',
      url: `${Url}/identity/risk-check/initialize`,
      data: {
        ...payload,
        type: 'individual',
        isSubjectConsent: true,
      },
      validateStatus: () => true,
      headers: {
        token: ApiKey,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<ICreateIndividualRiskCheckYouverifyResponse>(request);

    if (!data.success) {
      return {
        status: false,
        message: data.message,
        charge: true,
        id: 'id',
      };
    }

    return {
      status: false,
      message: data.message,
      charge: true,
      id: 'id',
    };
  }

  async createBusinessRiskCheck(
    payload: ICreateBusinessRiskCheck,
  ): Promise<ICreateBusinessRiskCheckResponse> {
    const { ApiKey, Url } = this;

    const request = {
      method: 'POST',
      url: `${Url}/identity/risk-check/initialize`,
      data: {
        ...payload,
        type: 'business',
        isSubjectConsent: true,
      },
      validateStatus: () => true,
      headers: {
        token: ApiKey,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<ICreateBusinessRiskCheckYouverifyResponse>(request);

    if (!data.success) {
      return {
        status: false,
        message: data.message,
        charge: true,
        id: 'id',
      };
    }

    return {
      status: false,
      message: data.message,
      charge: true,
      id: 'id',
    };
  }

  async fetchPassport(
    bvn: string,
    countryCode: string,
    lastName: string,
  ): Promise<IPassportResponse | IChargeData> {
    const { ApiKey, Url } = this;

    const request = {
      method: 'POST',
      url: `${Url}/identity/${countryCode.toLowerCase()}/passport`,
      data: {
        isSubjectConsent: true,
        id: bvn,
        lastName,
      },
      validateStatus: () => true,
      headers: {
        token: ApiKey,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IYouverifyAxiosPassportResponse>(request);

    if (!data.success || data?.data?.status === 'not_found') {
      return {
        status: false,
        message: data.message,
        chargeIdentity: true,
      };
    }

    return {
      status: true,
      firstName: data?.data?.firstName,
      lastName: data?.data?.lastName,
      middleName: data?.data?.middleName,
      dateOfBirth: data?.data?.dateOfBirth,
      imageUrl: data?.data?.image,
      gender: data?.data?.gender || 'N/A',
      phoneNumber: data?.data?.mobile,
      parentId: data?.data?.parentId,
      reason: data?.data?.reason,
      dataValidation: data?.data?.dataValidation,
      selfieValidation: data?.data?.selfieValidation,
      expiredDate: data?.data?.expiredDate,
      signature: data?.data?.signature,
      issuedAt: data?.data?.issuedAt,
      issuedDate: data?.data?.issuedDate,
      idNumber: data?.data?.idNumber,
    };
  }

  async fetchDriverLicense(
    id: string,
    countryCode: string,
  ): Promise<IDriverLicenseResponse | IChargeData> {
    const { ApiKey, Url } = this;

    const request = {
      method: 'POST',
      url: `${Url}/identity/${countryCode.toLowerCase()}/drivers-license`,
      data: {
        id,
        isSubjectConsent: true,
      },
      validateStatus: () => true,
      headers: {
        token: ApiKey,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IYouverifyAxiosDriverLicenseResponse>(request);

    if (!data.success || data?.data?.status === 'not_found') {
      return {
        status: false,
        message: data?.data?.status,
        chargeIdentity: true,
      };
    }

    return {
      status: true,
      firstName: data?.data?.firstName,
      lastName: data?.data?.lastName,
      middleName: data?.data?.middleName,
      dateOfBirth: data?.data?.dateOfBirth,
      imageUrl: data?.data?.image,
      gender: data?.data?.gender || 'N/A',
      reason: data?.data?.parentId,
      dataValidation: data?.data?.dataValidation,
      selfieValidation: data?.data?.selfieValidation,
      expiredDate: data?.data?.expiredDate,
      issuedDate: data?.data?.issuedDate,
      idNumber: data?.data?.idNumber,
      phoneNumber: data?.data?.mobile,
      email: data?.data?.email,
      stateOfIssuance: data?.data?.stateOfIssuance,
    };
  }

  async fetchAml(name: string, type = 'individual'): Promise<IAmlResponse | IChargeData> {
    const { ApiKey, Url } = this;
    try {
      const request = {
        method: 'POST',
        url: `${Url}/verifications/advanced/name/aml-checks`,
        data: {
          type,
          query: name,
          isSubjectConsent: true,
        },
        headers: {
          token: ApiKey,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await axios<IYouverifyAxiosAmlResponse>(request);

      if (!data.success) {
        return {
          status: false,
          message: data.message,
          chargeIdentity: true,
        };
      }

      return {
        status: true,
        sanctions: data?.data?.sanctions.map((item: Record<string, unknown>) => ({
          title: item.title,
          entityType: item.entityType,
          datasets: item.datasets,
          birthDate: item.birthDate,
          firstName: item.firstName,
          nationality: item.nationality,
          notes: item.notes,
          topics: item.topics,
          weakAlias: item.weakAlias,
          addressEntity: item.addressEntity,
          alias: item.alias,
          country: item.country,
          name: item.name,
          position: item.position,
          middleName: item.middleName,
          secondName: item.secondName,
          lastName: item.lastName,
          deathDate: item.deathDate,
          religion: item.religion,
          fatherName: item.fatherName,
          birthPlace: item.birthPlace,
          gender: item.gender,
          sourceUrl: item.sourceUrl,
          ethnicity: item.ethnicity,
          sanctions: item.sanctions,
          unknownLinkTo: item.unknownLinkTo,
          unknownLinkFrom: item.unknownLinkFrom,
        })),
        pep: data?.data?.pep,
        crime: data?.data?.crime,
        debarment: data?.data?.debarment,
        financialServices: data?.data?.financial_services,
        government: data?.data?.government,
        role: data?.data?.role,
        religion: data?.data?.religion,
        military: data?.data?.military,
        frozenAsset: data?.data?.frozen_asset,
        personOfInterest: data?.data?.personOfInterest,
        totalEntity: data?.data?.totalEntity,
        categoryCount: data?.data?.categoryCount,
        queriedWith: data?.data?.queriedWith,
        query: data?.data?.query,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(error?.response?.data?.message);
    }
  }
}
