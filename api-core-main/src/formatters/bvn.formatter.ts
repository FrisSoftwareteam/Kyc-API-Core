export interface IBvnFormatter {
  _id: string;
  status: string;
  reason: string;
  // dataValidation: boolean,
  // selfieValidation: boolean,
  firstName: string;
  middleName: string;
  lastName: string;
  image: string;
  enrollmentBranch: string;
  enrollmentInstitution: string;
  mobile: string;
  dateOfBirth: string;
  isConsent: boolean;
  idNumber: string;
  nin: string;
  shouldRetrivedNin: boolean;
  businessId: string;
  type: string;
  allValidationPassed: boolean;
  requestedAt: Date;
  requestedById: string;
  country: string;
  createdAt: Date;
  lastModifiedAt: Date;
  email: string;
  registrationDate: string;
  gender: string;
  levelOfAccount: string;
  title: string;
  maritalStatus: string;
  lgaOfOrigin: string;
  otherMobile: string;
  stateOfOrigin: string;
  watchListed: string;
  // nameOnCard: string,
  fullDetails: boolean;
  metadata: {
    [key: string]: string;
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ report }: any): IBvnFormatter => {
  return {
    _id: report._id,
    status: report.status,
    reason: report.reason,
    firstName: report.firstName,
    middleName: report.middleName,
    lastName: report.lastName,
    image: report.imageUrl,
    enrollmentBranch: report.enrollmentBranch,
    enrollmentInstitution: report.enrollmentInstitution,
    mobile: report.mobile,
    dateOfBirth: report.dateOfBirth,
    isConsent: report.isConsent,
    idNumber: report.idNumber,
    nin: report.nin,
    shouldRetrivedNin: report.shouldRetrivedNin,
    businessId: report.businessId,
    type: report.type,
    allValidationPassed: report.allValidationPassed,
    requestedAt: report.requestedAt,
    requestedById: report.requestedById,
    country: report.country,
    createdAt: report.createdAt,
    lastModifiedAt: report.lastModifiedAt,
    email: report.email,
    registrationDate: report.registrationDate,
    gender: report.gender,
    levelOfAccount: report.levelOfAccount,
    title: report.title,
    maritalStatus: report.maritalStatus,
    lgaOfOrigin: report.lgaOfOrigin,
    otherMobile: report.otherMobile,
    stateOfOrigin: report.stateOfOrigin,
    watchListed: report.watchListed,
    fullDetails: report.fullDetails,
    metadata: report?.metadata,
  };
};
