import { Document } from 'mongoose';

export interface IDriverLicense extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  secondPhoneNumber?: string;
  gender: string;
  idNumber: string;
  maritalStatus: string;
  lgaOfOrigin: string;
  stateOfOrigin: string;
  watchListed: string;
  nameOnCard: string;
  imageUrl: string;
  email: string;
  expiredDate: string;
  issuedDate: string;
  stateOfIssuance: string;
}
