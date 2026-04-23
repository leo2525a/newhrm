import mongoose, { Document, Schema } from 'mongoose';

export interface IJobPosting extends Document {
  title: string;
  department: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary';
  description: string;
  requirements: string[];
  responsibilities: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  closingDate?: Date;
  status: 'draft' | 'open' | 'closed' | 'filled';
  numberOfPositions: number;
  postedBy: mongoose.Types.ObjectId;
  postedAt: Date;
}

const JobPostingSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'temporary'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    requirements: [{
      type: String,
      required: true
    }],
    responsibilities: [{
      type: String,
      required: true
    }],
    salaryRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: 'HKD' }
    },
    closingDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'filled'],
      default: 'draft'
    },
    numberOfPositions: {
      type: Number,
      default: 1,
      min: 1
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    postedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);
