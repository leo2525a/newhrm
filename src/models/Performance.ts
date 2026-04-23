import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformanceGoal {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  targetDate: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'missed';
  progress: number; // 0-100
  achieved?: boolean;
  comments?: string;
}

export interface IPerformanceReview extends Document {
  employeeId: mongoose.Types.ObjectId;
  reviewPeriod: string; // e.g., "2024 H1"
  reviewType: 'quarterly' | 'half-year' | 'annual' | 'probation';
  startDate: Date;
  endDate: Date;
  goals: IPerformanceGoal[];
  selfAssessment?: {
    content: string;
    submittedAt?: Date;
  };
  managerAssessment?: {
    content: string;
    rating: number; // 1-5
    submittedBy?: mongoose.Types.ObjectId;
    submittedAt?: Date;
  };
  overallRating?: number; // 1-5
  strengths: string[];
  areasForImprovement: string[];
  developmentPlan?: string;
  status: 'draft' | 'self-assessment' | 'manager-review' | 'completed';
  createdBy: mongoose.Types.ObjectId;
  completedAt?: Date;
  comments?: string;
}

const PerformanceReviewSchema: Schema = new Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    reviewPeriod: {
      type: String,
      required: true
    },
    reviewType: {
      type: String,
      enum: ['quarterly', 'half-year', 'annual', 'probation'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    goals: [
      {
        title: { type: String, required: true },
        description: { type: String },
        targetDate: { type: Date, required: true },
        status: {
          type: String,
          enum: ['not-started', 'in-progress', 'completed', 'missed'],
          default: 'not-started'
        },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        achieved: { type: Boolean },
        comments: { type: String }
      }
    ],
    selfAssessment: {
      content: { type: String },
      submittedAt: { type: Date }
    },
    managerAssessment: {
      content: { type: String },
      rating: { type: Number, min: 1, max: 5 },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      submittedAt: { type: Date }
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5
    },
    strengths: [{
      type: String
    }],
    areasForImprovement: [{
      type: String
    }],
    developmentPlan: {
      type: String
    },
    status: {
      type: String,
      enum: ['draft', 'self-assessment', 'manager-review', 'completed'],
      default: 'draft'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completedAt: {
      type: Date
    },
    comments: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IPerformanceReview>('PerformanceReview', PerformanceReviewSchema);
