import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  documentType: 'contract' | 'offer-letter' | 'certificate' | 'id' | 'resume' | 'performance' | 'other';
  fileUrl: string;
  fileType: string; // mime type
  fileSize: number; // in bytes
  tags: string[];
  expiryDate?: Date;
  isConfidential: boolean;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  version: number;
  previousVersions: {
    version: number;
    fileUrl: string;
    uploadedAt: Date;
  }[];
}

const DocumentSchema: Schema = new Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: 500
    },
    documentType: {
      type: String,
      enum: ['contract', 'offer-letter', 'certificate', 'id', 'resume', 'performance', 'other'],
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    tags: [{
      type: String
    }],
    expiryDate: {
      type: Date
    },
    isConfidential: {
      type: Boolean,
      default: false
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    },
    previousVersions: [
      {
        version: { type: Number, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IDocument>('Document', DocumentSchema);
