import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  clockIn?: {
    time: Date;
    latitude?: number;
    longitude?: number;
    deviceInfo?: string;
  };
  clockOut?: {
    time: Date;
    latitude?: number;
    longitude?: number;
    deviceInfo?: string;
  };
  breakStart?: Date;
  breakEnd?: Date;
  status: 'pending' | 'complete' | 'absent' | 'half-day' | 'leave';
  workingHours: number;
  breakDuration: number;
  notes?: string;
  approved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
}

const AttendanceSchema: Schema = new Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    clockIn: {
      time: Date,
      latitude: Number,
      longitude: Number,
      deviceInfo: String
    },
    clockOut: {
      time: Date,
      latitude: Number,
      longitude: Number,
      deviceInfo: String
    },
    breakStart: {
      type: Date
    },
    breakEnd: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'complete', 'absent', 'half-day', 'leave'],
      default: 'pending'
    },
    workingHours: {
      type: Number,
      default: 0
    },
    breakDuration: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      maxlength: 500
    },
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one attendance per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Calculate working hours and break duration
AttendanceSchema.pre<IAttendance>('save', function (next) {
  if (this.clockIn && this.clockOut) {
    const clockInTime = this.clockIn.time.getTime();
    const clockOutTime = this.clockOut.time.getTime();
    
    let totalBreakMs = 0;
    if (this.breakStart && this.breakEnd) {
      totalBreakMs = this.breakEnd.getTime() - this.breakStart.getTime();
    }
    
    const totalMs = clockOutTime - clockInTime;
    const netMs = totalMs - totalBreakMs;
    
    this.workingHours = parseFloat((netMs / (1000 * 60 * 60)).toFixed(2));
    this.breakDuration = parseFloat((totalBreakMs / (1000 * 60 * 60)).toFixed(2));
    
    if (this.workingHours > 0) {
      this.status = this.workingHours < 4 ? 'half-day' : 'complete';
    }
  } else if (this.status === 'leave') {
    this.workingHours = 0;
  } else if (!this.clockIn) {
    this.status = 'absent';
  }
  
  next();
});

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
