import mongoose, { Document, Schema } from 'mongoose';

export interface ILeave extends Document {
  employeeId: mongoose.Types.ObjectId;
  leaveType: 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  startDate: Date;
  endDate: Date;
  halfDay: boolean;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  numberOfDays: number;
  comments?: string;
}

const LeaveSchema: Schema = new Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'],
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
    halfDay: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      maxlength: 500
    },
    numberOfDays: {
      type: Number,
      required: true
    },
    comments: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Calculate number of working days before saving
LeaveSchema.pre<ILeave>('save', function (next) {
  if (this.startDate && this.endDate) {
    let days = 0;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (start.toDateString() === end.toDateString()) {
      days = this.halfDay ? 0.5 : 1;
    } else {
      let current = new Date(start);
      while (current <= end) {
        const dayOfWeek = current.getDay();
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          days++;
        }
        current.setDate(current.getDate() + 1);
      }
      
      if (this.halfDay) {
        days = days - 0.5;
      }
    }
    
    this.numberOfDays = days;
  }
  next();
});

export default mongoose.model<ILeave>('Leave', LeaveSchema);
