import Business from '../business.model';

export interface ICard {
  business: typeof Business;
  authorizationCode: string;
  bin: string;
  lastFourDigit: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: string;
  reusable: boolean;
}
