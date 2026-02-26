import mongoose from 'mongoose'

const ReviewSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  message: {
    type: String,
    default: ''
  },
  candidateName: {
    type: String,
    default: 'Anonymous'
  },
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  }
})

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema)
