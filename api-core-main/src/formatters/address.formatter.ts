import CandidateFormatter, { ICandidateFormatter } from './candidate.formatter';
import AgentFormatter, { IAgentFormatter } from './agent.formatter';
import { distanceBetweenPoints } from '../utils/helper';
import AddressLogic from '../logics/address.logic';
import { AdminApprovalStatusEnum } from '../models/types/address.type';

export interface IAddressFormatter {
  position: {
    latitude: number;
    longitude: number;
  };
  submissionLocation?: {
    latitude: number;
    longitude: number;
  };
  category: string;
  formatAddress: string;
  details: {
    flatNumber: string;
    buildingName: string;
    buildingNumber: string;
    subStreet: string;
    street: string;
    landmark: string;
    state: string;
    city: string;
    country: string;
    lga: string;
  };
  candidate: ICandidateFormatter;
  referenceId: string;
  status: string;
  taskStatus: string;
  subjectConsent: string;
  startDate: string;
  endDate: string;
  submittedAt: string;
  executionDate: string;
  completedAt: string;
  acceptedAt: string;
  revalidationDate: string;
  notes: string[];
  isFlagged: string;
  reportGeolocationUrl: string;
  mapAddressUrl: string;
  submissionDistanceInMeters: string;
  reasons: string;
  signature: string;
  images: string[];
  additionalInfo: string;
  reportAgentAccess: string;
  incidentReport: string;
  description: string;
  reportId: string;
  downloadUrl: string;
  userId: string;
  type: string;
  createdAt: Date;
  lastModifiedAt: Date;
  _id: string;
  cost?: number;
  googleMapUrl: string;
  agentLocationGoogleMapUrl?: string;
  distanceBetweenLocation?: number;
  addressGoogleMapUrl?: string;
  agent?: IAgentFormatter;
  agentReports: Record<string, unknown>;
  timelines: Record<string, unknown>;
  approver: {
    user: string;
    status: string;
  };
  task: string;
  accuracy: string;
  submissionExpectedAt: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ address }: any): IAddressFormatter | undefined => {
  if (Array.isArray(address)) {
    if (address.length === 0) {
      return undefined;
    }
    address = address[0];
  }

  return {
    position: {
      latitude: address?.position?.latitude,
      longitude: address?.position?.longitude,
    },
    submissionLocation: {
      latitude: address.submissionLocation?.latitude,
      longitude: address.submissionLocation?.longitude,
    },
    category: address?.category,
    candidate: CandidateFormatter({ candidate: address?.candidate }),
    formatAddress: address?.formatAddress,
    details: {
      flatNumber: address?.details?.flatNumber,
      buildingName: address?.details?.buildingName,
      buildingNumber: address?.details?.buildingNumber,
      subStreet: address?.details?.subStreet,
      street: address?.details?.street,
      landmark: address?.details?.landmark,
      state: address?.details?.state,
      city: address?.details?.city,
      country: address?.details?.country,
      lga: address?.details?.lga,
    },
    referenceId: address?.referenceId,
    status: address?.status,
    taskStatus: address?.taskStatus,
    subjectConsent: address?.subjectConsent,
    startDate: address?.startDate,
    endDate: address?.endDate,
    submittedAt: address?.submittedAt,
    executionDate: address?.executionDate,
    completedAt: address?.completedAt,
    acceptedAt: address?.acceptedAt,
    revalidationDate: address?.revalidationDate,
    notes: address?.notes,
    isFlagged: address?.isFlagged,
    reportGeolocationUrl: address?.reportGeolocationUrl,
    mapAddressUrl: address?.mapAddressUrl,
    submissionDistanceInMeters: address?.submissionDistanceInMeters,
    reasons: address?.reasons,
    signature: address?.signature,
    images: address?.images,
    agentReports: address?.agentReports,
    additionalInfo: address?.additionalInfo,
    reportAgentAccess: address?.reportAgentAccess,
    incidentReport: address?.incidentReport,
    description: address?.description,
    reportId: address?.reportId,
    downloadUrl: address?.downloadUrl,
    userId: address?.userId,
    type: address?.type,
    createdAt: address?.createdAt,
    lastModifiedAt: address?.lastModifiedAt,
    _id: address?._id,
    cost: address?.cost,
    googleMapUrl: AddressLogic.generateGoogleMapAddressLink(address.formatAddress),
    agentLocationGoogleMapUrl: address?.submissionLocation
      ? AddressLogic.generateGoogleMapGeocodeLink(
          address.submissionLocation?.latitude,
          address.submissionLocation?.longitude,
        )
      : undefined,
    distanceBetweenLocation: distanceBetweenPoints(
      address?.position?.latitude,
      address?.position?.longitude,
      address.submissionLocation?.latitude,
      address.submissionLocation?.longitude,
      'M',
    ),
    addressGoogleMapUrl: AddressLogic.generateGoogleMapRouteLink(
      address?.position?.latitude,
      address?.position?.longitude,
      address.submissionLocation?.latitude,
      address.submissionLocation?.longitude,
    ),
    agent: address?.agent ? AgentFormatter({ agent: address.agent }) : undefined,
    timelines: {
      acceptedAt: address?.timelines?.acceptedAt,
      assignedAt: address?.timelines?.assignedAt,
      completedAt: address?.timelines?.completedAt,
    },
    task: address?.task,
    submissionExpectedAt: address?.submissionExpectedAt,
    approver: {
      user: address?.approver?.user || '',
      status: address?.approver?.status || AdminApprovalStatusEnum.REVIEW,
    },
    accuracy: AddressLogic.calculateAccuracy(address),
  };
};
