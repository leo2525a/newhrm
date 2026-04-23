import mongoose, { Document, Schema } from 'mongoose';

export interface IEmploymentHistory {
  position: string;
  department: string;
  startDate: Date;
  endDate?: Date;
  salary: number;
  currency: string;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IEmployee extends Document {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  nationalId: string;
  passportNumber?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  emergencyContacts: IEmergencyContact[];
  department: string;
  position: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary';
  startDate: Date;
  endDate?: Date;
  probationEndDate?: Date;
  salary: number;
  currency: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    branchCode: string;
  };
  mpfNumber?: string; // HK Mandatory Provident Fund
  taxNumber?: string; // HK IRD number
  employmentHistory: IEmploymentHistory[];
  skills: string[];
  qualifications: {
    degree: string;
    institution: string;
    graduationYear: number;
  }[];
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  photoUrl?: string;
  createdBy: mongoose.Types.ObjectId;
}

const EmployeeSchema: Schema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true
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
      unique: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    nationalId: {
      type: String,
      required: true
    },
    passportNumber: {
      type: String
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'Hong Kong' }
    },
    emergencyContacts: [
      {
        name: { type: String, required: true },
        relationship: { type: String, required: true },
        phone: { type: String, required: true }
      }
    ],
    department: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'temporary'],
      default: 'full-time'
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    probationEndDate: {
      type: Date
    },
    salary: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'HKD'
    },
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      branchCode: { type: String }
    },
    mpfNumber: {
      type: String // Hong Kong MPF
    },
    taxNumber: {
      type: String // HK IRD Tax Reference Number
    },
    employmentHistory: [
      {
        position: { type: String, required: true },
        department: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        salary: { type: Number, required: true },
        currency: { type: String, default: 'HKD' }
      }
    ],
    skills: [{ type: String }],
    qualifications: [
      {
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        graduationYear: { type: Number, required: true }
      }
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave', 'terminated'],
      default: 'active'
    },
    photoUrl: {
      type: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Full name virtual
EmployeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
