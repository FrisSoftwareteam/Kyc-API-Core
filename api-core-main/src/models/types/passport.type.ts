import { Document } from 'mongoose';

export interface IPassport extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  gender: string;
  passportNumber: string;
  maritalStatus: string;
  lgaOfOrigin: string;
  stateOfOrigin: string;
  signature: string;
  nameOnCard: string;
  imageUrl: string;
  issuedAt: string;
  expiredDate: string;
  issuedDate: string;
  stateOfIssuance: string;
}
