import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  uploadDate: Date;
  userEmail?: string; // set when user is logged in for history & last-analysis
  analysisResult: {
    score: number;
    atsScore: {
      keywords: number;
      format: number;
      overall: number;
    };
    contentScore: {
      grammar: number;
      clarity: number;
      actionVerbs: number;
    };
    suggestions: Array<{
      type: 'critical' | 'important' | 'minor';
      title: string;
      description: string;
      example?: string;
    }>;
    keywords: {
      found: string[];
      missing: string[];
    };
  };
  resumeText: string;
  ipAddress?: string;
  userAgent?: string;
}

const ResumeSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  userEmail: { type: String, default: null },
  analysisResult: {
    score: { type: Number, required: true },
    atsScore: {
      keywords: { type: Number, required: true },
      format: { type: Number, required: true },
      overall: { type: Number, required: true }
    },
    contentScore: {
      grammar: { type: Number, required: true },
      clarity: { type: Number, required: true },
      actionVerbs: { type: Number, required: true }
    },
    suggestions: [{
      type: { type: String, enum: ['critical', 'important', 'minor'], required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      example: { type: String }
    }],
    keywords: {
      found: [{ type: String }],
      missing: [{ type: String }]
    }
  },
  resumeText: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: true
});

// Create index for better query performance
ResumeSchema.index({ uploadDate: -1 });
ResumeSchema.index({ 'analysisResult.score': -1 });
ResumeSchema.index({ userEmail: 1, uploadDate: -1 });

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
