export interface ICardFormatter {
  bin: string;
  lastFourDigit: string;
  expiryMonth: string;
  expiryYear: string;
  reference: string;
  cardType: string;
  reusable: boolean;
  _id: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ card }: any): ICardFormatter => {
  return {
    bin: card?.bin,
    lastFourDigit: card?.lastFourDigit,
    expiryMonth: card?.expiryMonth,
    expiryYear: card?.expiryYear,
    reference: card?.reference,
    cardType: card?.cardType,
    reusable: card?.reusable,
    _id: card?._id,
  };
};
