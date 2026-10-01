export interface IProjectVerificationFormatter {
  _id: string;
  projectImageUrl: string;
  letterOfAuthorizationImageUrl: string;
  description?: string;
  documents: [string];
  handlingType: string;
  interval: string;
  cost: number;
  responsePayload: Map<string, unknown>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ project }: any): IProjectVerificationFormatter => {
  return {
    _id: project?._id,
    projectImageUrl: project?.projectImageUrl,
    letterOfAuthorizationImageUrl: project?.letterOfAuthorizationImageUrl,
    description: project?.description,
    documents: project?.documents,
    handlingType: project?.handlingType,
    interval: project?.interval,
    cost: project?.cost,
    responsePayload: project?.responsePayload,
  };
};
