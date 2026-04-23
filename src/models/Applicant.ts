import mongoose, { Document, Schema } from 'mongoose';

export interface IApplicant extends Document {
  jobPostingId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  resumeUrl?: string;
  coverLetter?: string;
  experience: number; // years
  education: string;
  skills: string[];
  currentPosition?: string;
  expectedSalary: {
    amount: number;
    currency: string;
  };
  availability?: Date;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  stage: number;
  notes: {
    content: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }[];
  interviews: {
    date: Date;
    interviewer: mongoose.Types.ObjectId;
    feedback?: string;
    rating?: number; // 1-5
    status: 'scheduled' | 'completed' | 'cancelled';
  }[];
  referral?: string;
  source: string;
  createdAt: Date;
}

const ApplicantSchema: Schema = new Schema(
  {
    jobPostingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String
    },
    resumeUrl: {
      type: String
    },
    coverLetter: {
      type: String
    },
    experience: {
      type: Number,
      required: true,
      default: 0
    },
    education: {
      type: String,
      required: true
    },
    skills: [{
      type: String
    }],
    currentPosition: {
      type: String
    },
    expectedSalary: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'HKD' }
    },
    availability: {
      type: Date
    },
    status: {
      type: String,
      enum: ['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'],
      default: 'new'
    },
    stage: {
      type: Number,
      default: 1
    },
    notes: [
      {
        content: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    interviews: [
      {
        date: { type: Date, required: true },
        interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        feedback: { type: String },
        rating: { type: Number, min: 1, max: 5 },
        status: {
          type: String,
          enum: ['scheduled', 'completed', 'cancelled'],
          default: 'scheduled'
        }
      }
    ],
    referral: {
      type: String
    },
    source: {
      type: String,
      default: 'company-website'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IApplicant>('Applicant', ApplicantSchema);
