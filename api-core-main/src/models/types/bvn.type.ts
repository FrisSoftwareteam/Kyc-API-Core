import { Document } from 'mongoose';

export interface IBvn extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  secondPhoneNumber?: string;
  gender: string;
  nin?: string;
  bvn: string;
  maritalStatus: string;
  lgaOfOrigin: string;
  stateOfOrigin: string;
  watchListed: string;
  nameOnCard: string;
  imageUrl: string;
}
