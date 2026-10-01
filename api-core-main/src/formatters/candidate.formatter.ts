export interface ICandidateFormatter {
  _id: string;
  firstName: string;
  lastName: string;
  middleName: string;
  phoneNumber: string;
  email: string;
  imageUrl: string;
  dateOfBirth: string;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ candidate }: any): ICandidateFormatter => {
  if (Array.isArray(candidate)) {
    candidate = candidate[0];
  }

  return {
    _id: candidate?._id,
    firstName: candidate?.firstName,
    lastName: candidate?.lastName,
    middleName: candidate?.middleName,
    email: candidate?.email,
    phoneNumber: candidate?.phoneNumber,
    imageUrl: candidate?.imageUrl,
    dateOfBirth: candidate?.dateOfBirth,
    createdAt: candidate?.createdAt,
  };
};
