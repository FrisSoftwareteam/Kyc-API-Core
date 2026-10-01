import { Schema } from 'mongoose';

const ProjectSchema = new Schema(
  {
    business: { type: Schema.Types.ObjectId, required: true, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifier: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    projectImageUrl: { type: String, required: true },
    letterOfAuthorizationImageUrl: { type: String, required: true },
    description: { type: String, required: false },
    documents: { type: [String], required: true },
    handlingType: { type: String, required: false },
    interval: { type: Number, required: false, default: 0 },
    cost: { type: Number, required: true },
    responsePayload: { type: Map, of: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Project', ProjectSchema);
};
