import { Document } from 'mongoose';

export interface INin extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  secondPhoneNumber?: string;
  gender: string;
  nin: string;
  maritalStatus: string;
  lgaOfOrigin: string;
  stateOfOrigin: string;
  imageUrl: string;
  signatureUrl: string;
  email: string;
  birthState: string;
  nextOfKinState: string;
  religion: string;
  birthLGA: string;
  birthCountry: string;
  country: string;
}
