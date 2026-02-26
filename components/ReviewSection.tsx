'use client'

import { useState } from 'react'
import { Star, Send, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ReviewSectionProps {
  onSubmit: (rating: number, message: string) => void
}

export default function ReviewSection({ onSubmit }: ReviewSectionProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [message, setMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return // Rating is mandatory
    
    setIsSubmitting(true)
    try {
      await onSubmit(rating, message)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Review submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor'
      case 2: return 'Fair'
      case 3: return 'Good'
      case 4: return 'Very Good'
      case 5: return 'Excellent'
      default: return 'Rate your experience'
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 border border-green-200 shadow-lg"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">
            Thank You for Your Review! 🙏
          </h3>
          <p className="text-green-700 text-lg">
            Your feedback helps us improve our resume analysis service.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200 shadow-lg"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          How was your experience?
        </h3>
        <p className="text-gray-600">
          We'd love to hear your feedback! Rating is required, but message is optional.
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center items-center mb-6">
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-colors duration-200 ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Rating Label */}
      <div className="text-center mb-6">
        <p className="text-lg font-semibold text-gray-700">
          {getRatingLabel(hoveredRating || rating)}
        </p>
      </div>

      {/* Message Input */}
      <div className="mb-6">
        <label htmlFor="review-message" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Feedback (Optional)
        </label>
        <textarea
          id="review-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you liked or how we can improve..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          maxLength={500}
        />
        <div className="text-right mt-1">
          <span className="text-sm text-gray-500">
            {message.length}/500 characters
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-200 ${
            rating === 0 || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Submit Review
            </>
          )}
        </motion.button>
        
        {rating === 0 && (
          <p className="text-red-500 text-sm mt-2">
            Please select a rating before submitting
          </p>
        )}
      </div>
    </motion.div>
  )
}
