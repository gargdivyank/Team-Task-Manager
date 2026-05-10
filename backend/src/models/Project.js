import mongoose from 'mongoose';

export const PROJECT_STATUSES = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'Not Started',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Project =
  mongoose.models.Project || mongoose.model('Project', projectSchema);
