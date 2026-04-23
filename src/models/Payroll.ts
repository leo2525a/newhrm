import mongoose, { Document, Schema } from 'mongoose';

export interface IDeduction {
  name: string;
  amount: number;
  type: 'mpf' | 'tax' | 'insurance' | 'other';
}

export interface IAddition {
  name: string;
  amount: number;
  type: 'overtime' | 'bonus' | 'allowance' | 'other';
}

export interface IPayroll extends Document {
  employeeId: mongoose.Types.ObjectId;
  payPeriod: string; // e.g., "2024-01"
  payDate: Date;
  baseSalary: number;
  additions: IAddition[];
  deductions: IDeduction[];
  grossPay: number;
  netPay: number;
  totalAdditions: number;
  totalDeductions: number;
  mpfContribution: number; // HK MPF
  status: 'draft' | 'approved' | 'paid';
  paymentMethod: 'bank-transfer' | 'check' | 'cash';
  transactionId?: string;
  paidAt?: Date;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const PayrollSchema: Schema = new Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    payPeriod: {
      type: String,
      required: true,
      description: 'YYYY-MM format'
    },
    payDate: {
      type: Date,
      required: true
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0
    },
    additions: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        type: {
          type: String,
          enum: ['overtime', 'bonus', 'allowance', 'other'],
          required: true
        }
      }
    ],
    deductions: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        type: {
          type: String,
          enum: ['mpf', 'tax', 'insurance', 'other'],
          required: true
        }
      }
    ],
    grossPay: {
      type: Number,
      default: 0
    },
    netPay: {
      type: Number,
      default: 0
    },
    totalAdditions: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      default: 0
    },
    mpfContribution: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft'
    },
    paymentMethod: {
      type: String,
      enum: ['bank-transfer', 'check', 'cash'],
      default: 'bank-transfer'
    },
    transactionId: {
      type: String
    },
    paidAt: {
      type: Date
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

// Calculate totals before saving
PayrollSchema.pre<IPayroll>('save', function (next) {
  this.totalAdditions = this.additions.reduce((sum, add) => sum + add.amount, 0);
  this.totalDeductions = this.deductions.reduce((sum, ded) => sum + ded.amount, 0);
  this.grossPay = this.baseSalary + this.totalAdditions;
  this.netPay = this.grossPay - this.totalDeductions;
  
  // Find MPF contribution
  const mpfDeduction = this.deductions.find(d => d.type === 'mpf');
  this.mpfContribution = mpfDeduction ? mpfDeduction.amount : 0;
  
  next();
});

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
