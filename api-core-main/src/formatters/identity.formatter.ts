import IdentityLogic from '../logics/identity.logic';
export interface IIdentityFormatter {
  // _id: string;
  idType: string;
  idNumber: string;
  status: string;
  cost?: number;
  data: Map<string, unknown>;
  validationData: Map<string, unknown>;
  validationResponse: unknown;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ identity }: any): IIdentityFormatter | undefined => {
  if (Array.isArray(identity)) {
    if (identity.length === 0) {
      return undefined;
    }
    identity = identity[0];
  }

  return {
    idType: identity.idType,
    idNumber: identity.idNumber,
    status: identity.status,
    cost: identity.cost,
    validationData: identity.validationData ? identity.validationData : undefined,
    data: identity.identityResponse,
    validationResponse: identity?.validationData
      ? IdentityLogic.validate(identity?.validationData, {
          firstName: identity?.identityResponse?.firstName || 'N/A',
          lastName: identity?.identityResponse?.lastName || 'N/A',
          dateOfBirth: identity?.identityResponse?.dateOfBirth || 'N/A',
        })
      : undefined,
  };
};
