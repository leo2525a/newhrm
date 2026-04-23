import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveBalance extends Document {
  employeeId: mongoose.Types.ObjectId;
  year: number;
  leaveType: 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  entitlement: number;
  used: number;
  carriedForward: number;
  remaining: number;
}

const LeaveBalanceSchema: Schema = new Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'],
      required: true
    },
    entitlement: {
      type: Number,
      required: true,
      default: 0
    },
    used: {
      type: Number,
      default: 0
    },
    carriedForward: {
      type: Number,
      default: 0
    },
    remaining: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Calculate remaining before saving
LeaveBalanceSchema.pre<ILeaveBalance>('save', function (next) {
  this.remaining = (this.entitlement + this.carriedForward) - this.used;
  next();
});

export default mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
